const userModel = require('../models/user.model');
const customerModel = require('../models/customer.model');
const { encryption, comparison } = require("../helper/encryptDecrypt");
const { uploadImage, deleteImage } = require("../config/supabase");

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
        console.log("BODY: ", req.body);
        console.log("FILE: ", req.file);
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
            profileImageUrl = await uploadImage(profileFile);
        }

        if(licenseFile) {
            licenseImageUrl = await uploadImage(licenseFile);
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
        })

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
        } else {
            return res.status(200).json({
                data: foundUser,
                message: "Login Success!",
                success: true
            });
        }
    } catch (error) {
        console.log('Error occurred at loginUser()')
        res.status(500).json({message: "Internal Server Error!", error});
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

        const customer = await customerModel.findOne({ userId: user._id });

        let finalData = {...req.body};
        
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
            const profileImageUrl = await uploadImage(profileFile);
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
                const licenseImageUrl = await uploadImage(licenseFile);
                customerUpdate.licenseImageUrl = licenseImageUrl;
            }

            if(req.body.phoneNumber) {
                customerUpdate.phoneNumber = req.body.phoneNumber;
            }

            if(req.body.dateOfBirth) {
                customerUpdate.dateOfBirth = req.body.dateOfBirth;
            }

            if(req.body.verificationStatus) {
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
    updateUser,
    deleteUser
}