const userModel = require('../models/user.model');
const customerModel = require('../models/customer.model');
const { encryption, comparison } = require("../helper/encryptDecrypt");
const { uploadImage } = require("../config/supabase");

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

        const { phoneNumber, dateOfBirth, licenseImageUrl, verificationStatus } = req.body;

        const user = await userModel.create({
            ...req.body,
            password: encryption(req.body.password),
        });

        if(user.role === "Customer") {
            if(!req.file) {
                return res.status(400).json({ message: "License Image is required!", success: false});
            }

            const licenseImageUrl = await uploadImage(req.file);

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
        
    } catch (error) {
        console.log('Error occurred at loginUser()')
        res.status(500).json({message: "Internal Server Error!", error});
    }
}

const updateUser = async (req, res) => {
    try {
        
    } catch (error) {
        console.log('Error occurred at updateUser()');
        req.status(500).json({message: "Internal Server Error", error});
    }
}

const deleteUser = async function (req, res) {
    try {
        
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
