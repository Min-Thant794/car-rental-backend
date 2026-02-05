const express = require('express');
const router = express.Router();
const { getAllUsers,registerUser, loginUser, updateUser, deleteUser } = require("../controllers/user.controller");
const upload= require("../config/multer");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const userModel = require('../models/user.model');
//const customerAccess = require("../middleware/customerAccess");

//check session or cookie

router.post("/", upload.fields([{ name: "profileImageUrl", maxCount: 1}, { name: "licenseImageUrl", maxCount: 1}]), registerUser);
router.post("/auth/login", loginUser)
router.get("/", auth, adminOnly, getAllUsers)
router.put("/:id", auth, upload.fields([{ name: "profileImageUrl", maxCount: 1}, {name: "licenseImageUrl", maxCount: 1}]), updateUser);
router.delete("/:id", auth, adminOnly, deleteUser)
router.post("/auth/logout", auth,(req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: false
    });

    return res.status(200).json({
        message: "Logged out successfully!",
        success: true
    });
});

module.exports = router