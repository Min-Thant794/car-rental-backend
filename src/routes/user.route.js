const express = require('express');
const router = express.Router();
const { getAllUsers,registerUser, loginUser, updateUser, deleteUser } = require("../controllers/user.controller");
const upload= require("../config/multer");

router.post("/", upload.fields([{ name: "profileImageUrl", maxCount: 1}, { name: "licenseImageUrl", maxCount: 1}]), registerUser);
router.post("/login", loginUser)
router.get("/users", getAllUsers)
router.put("/:id", upload.fields([{ name: "profileImageUrl", maxCount: 1}, {name: "licenseImageUrl", maxCount: 1}]), updateUser);
router.delete("/:id", deleteUser)

module.exports = router