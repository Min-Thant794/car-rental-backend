const userModel = require('../models/user.model');
const customerModel = require('../models/customer.model');
const { encryption, comparison } = require("../helper/encryptDecrypt");
const { uploadImage, deleteImage } = require("../config/supabase");
const config = require("../config/config");
const jwt = require('jsonwebtoken');

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.aggregate([
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "userId",
          as: "customerProfile"
        }
      },
      {
        $unwind: {
          path: "$customerProfile",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          password: 0
        }
      }
    ]);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });

  } catch (error) {
    console.log("An error occurred at getAllUsers()", error);
    return res.status(500).json({
      message: "Failed to fetch users",
      success: false
    });
  }
};

const registerUser = async (req, res) => {
    try {
        //console.log("BODY: ", req.body);
        //console.log("FILE: ", req.file);
        const duplicateUser = await userModel.findOne({
            $or: [
                {userName: req.body.userName},
                {email: req.body.email}
            ]
        });

        if (duplicateUser) {
        return res.status(409).json({
            message: "User already exists",
            success: false
        });
        }

        const { phoneNumber, dateOfBirth, verificationStatus } = req.body;

        const profileFile = req.files?.profileImageUrl?.[0];
        const licenseFile = req.files?.licenseImageUrl?.[0];

        let profileImageUrl = null;
        let licenseImageUrl = null;

        if(profileFile) {
            profileImageUrl = await uploadImage(profileFile, config.SUPABASE_USER_BUCKET);
        }

        if(licenseFile) {
            licenseImageUrl = await uploadImage(licenseFile, config.SUPABASE_LICENSE_BUCKET);
        }

        const user = await userModel.create({
            ...req.body,
            profileImageUrl,
            password: encryption(req.body.password),
        });

        if(user.role === "Customer") {
            if(!licenseImageUrl) {
                return res.status(400).json({ message: "License Image is required!", success: false});
            }

            await customerModel.create({
                userId: user._id,
                phoneNumber,
                dateOfBirth,
                licenseImageUrl,
                verificationStatus
            });
        }

        res.status(200).json({
            data: user,
            message: `User ${user.userName} has successfully created!`,
            success: true
        });

    } catch (error) {
        if (error?.code === 11000) {
            const fields = Object.keys(error.keyPattern || {});
            const fieldLabel = fields.length ? fields.join(", ") : "field";
            return res.status(409).json({
                message: `Duplicate ${fieldLabel}.`,
                success: false
            });
        }
        console.log("An Error Occurred at registerUser()", error);
        res.status(500).json({ message: "Internal Server Error!", success: false});
    }
}

const loginUser = async (req, res) => {
    try {
        const { userName, password } = req.body;

        if(!userName || !password) {
            return res.status(400).json({message: "username and password are required!", success: false});
        }

        const foundUser = await userModel.findOne({ userName });
        if(!foundUser) {
            return res.status(400).json({ message: "User does not exist!"});
        }

        const isPasswordCorrect = await comparison(password, foundUser.password);
        if(!isPasswordCorrect) {
            return res.status(403).json({ message: "User not authenticated!", success: false});
        }

        //console.log("JWT_SECRET_KEY:", config.JWT_SECRET_KEY);
        //console.log("JWT_EXPIRE_IN:", config.JWT_EXPIRE_IN);
        //console.log("JWT LIB:", jwt);

        const token = jwt.sign(
            {
                userId: foundUser._id,
                role: foundUser.role,
            },
            config.JWT_SECRET_KEY,
            {
                expiresIn: config.JWT_EXPIRE_IN || "1d"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,      //true when using HTTPS
            sameSite: "lax",    // cross-domain frontend
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })

        return res.status(200).json({
            data: {foundUser, token},
            message: "Login Success!",
            success: true
        });
    } catch (error) {
        console.log('Error occurred at loginUser()')
        res.status(500).json({message: "Internal Server Error!", error});
    }
}

const getCurrentUser = async (req, res) => {
    try {
        const token = req.cookies?.token;

        if(!token) {
            return res.status(401).json({
                message: "Authentication Requried!",
                success: false,
                data: null
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET_KEY);
        const user = await userModel.findById(decoded.userId).select("-password");

        if(!user) {
            return res.status(401).json({
                message: "User not authenticated!",
                success: false,
                data: null
            });
        }

        const customerProfile = await customerModel.findOne({ userId: user._id });

        return res.status(200).json({
            message: "User Authenticated!",
            success: true,
            data: {
                user,
                customerProfile
            }
        });
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
            success: false,
            data: null
        });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { userName, password } = req.body;

        if(!userName || !password) {
            return res.status(400).json({ message: "username and password are required!", success: false });
        }

        const foundUser = await userModel.findOne({ userName });
        if(!foundUser) {
            return res.status(403).json({ message: "User does not exist!" });
        }

        if(foundUser.role !== "Admin") {
            return res.status(403).json({ message: "Admin Access Only", success: false });
        }

        const isPasswordCorrect = await comparison(password, foundUser.password);
        if(!isPasswordCorrect) {
            return res.status(403).json({ message: "User not authenticated!", success: false });
        }

        const token = jwt.sign(
            {
                userId: foundUser._id,
                role: foundUser.role
            },
            config.JWT_SECRET_KEY,
            {
                expiresIn: config.JWT_EXPIRE_IN || "1d"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            data: { foundUser, token },
            message: "Login Success!",
            success: true
        });
    } catch (error) {
        console.log("An Error Occurred at loginAdmin()");
        res.status(500).json({ message: "Internal Server Error!", error });
    }
}

const getCurrentAdmin = async (req, res) => {
    try {
        const token = req.cookies?.token;

        if(!token) {
            return res.status(401).json({
                message: "Authentication Required!",
                success: false,
                data: null
            });
        }

        const decoded = jwt.verify(token, config.JWT_SECRET_KEY);
        const user = await userModel.findById(decoded.userId).select("-password");

        if(!user || user.role !== "Admin") {
            return res.status(403).json({
                message: "Admin Access Only",
                success: false,
                data: null
            });
        }

        return res.status(200).json({
            message: "Admin Authenticated",
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
            success: false,
            data: null
        })
    }
}

const updateUser = async (req, res) => {
    //console.log("FILES: updateUser(): ", req.files);
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);

        if(!user) {
            return res.status(404).json({ message: "User not found!", success: false });
        }

        if(req.user.role !== "Admin" && req.user.id !== id) {
            return res.status(403).json({ message: "You are not allowed to update this user.", success: false });
        }

        const customer = await customerModel.findOne({ userId: user._id });

        let finalData = {...req.body};

        if(req.user.role !== "Admin") {
            delete finalData.role;
        }
        
        if(req.body.password && req.body.password.trim() !== "") {
            finalData.password = encryption(req.body.password);
        } else {
            delete finalData.password
        }

        const profileFile = req.files?.profileImageUrl?.[0];
        const licenseFile = req.files?.licenseImageUrl?.[0];

        if(profileFile) {
            if(user?.profileImageUrl) {
                await deleteImage(user?.profileImageUrl);
            }
            const profileImageUrl = await uploadImage(profileFile, config.SUPABASE_USER_BUCKET);
            finalData.profileImageUrl = profileImageUrl;
        }

        const updatedUser = await userModel.findByIdAndUpdate(id, finalData, { new: true})

        if(!updatedUser) {
            return res.status(400).json({ message: "Failed to update user!", success: false });
        }

        if(updatedUser.role === "Customer") {
            const customerUpdate = {};

            if(licenseFile) {
                if(customer?.licenseImageUrl) {
                    await deleteImage(customer?.licenseImageUrl);
                }
                const licenseImageUrl = await uploadImage(licenseFile, config.SUPABASE_LICENSE_BUCKET);
                customerUpdate.licenseImageUrl = licenseImageUrl;
            }

            if(req.body.phoneNumber) {
                customerUpdate.phoneNumber = req.body.phoneNumber;
            }

            if(req.body.dateOfBirth) {
                customerUpdate.dateOfBirth = req.body.dateOfBirth;
            }

            if(req.user.role === "Admin" && req.body.verificationStatus) {
                customerUpdate.verificationStatus = req.body.verificationStatus;
            }

            if(Object.keys(customerUpdate).length > 0) {
                await customerModel.findOneAndUpdate(
                    {userId: user._id},
                    customerUpdate,
                    {new: true, upsert: true}
                );
            }
        }

        return res.status(200).json({ message: "User updated successfully!", data: updatedUser, success: true});

    } catch (error) {
        console.log('Error occurred at updateUser()');
        res.status(500).json({message: "Internal Server Error", error});
    }
}

const deleteUser = async (req, res) => {
    try {
        const {id} = req.params;
        const user = await userModel.findById(id);
        if(!user) {
            return res.status(404).json({ message: "User not found!", success: false });
        }
        
        if(user.profileImageUrl) {
            await deleteImage(user.profileImageUrl);
        }

        const customer = await customerModel.findOne({ userId: user._id});

        if(customer) {
            if(customer?.licenseImageUrl) {
                await deleteImage(customer.licenseImageUrl);
            }
            await customer.deleteOne();
        }

        const deletedUser = await user.deleteOne();

        if (deletedUser) {
            return res.status(200).json({ message: "User deleted successfully", success: true});
        } else {
            return res.status(400).json({ message: "Failed to delete user!", success: false });
        }

    } catch (error) {
        console.log("An Error at deleteUser()", error);
        res.status(500).json({message: "Internal Server Error", error});
    }
}

module.exports = {
    getAllUsers,
    registerUser,
    loginUser,
    getCurrentUser,
    loginAdmin,
    getCurrentAdmin,
    updateUser,
    deleteUser
}