const express = require('express');
const router = express.Router();
const { getAllUsers,registerUser, loginUser, updateUser, deleteUser } = require("../controllers/user.controller");
const upload= require("../config/multer");

router.post("/", upload.single("licenseImageUrl"), registerUser);
router.post("/login", loginUser)
router.get("/users", getAllUsers)
router.put("/:id", updateUser)
router.delete("/:id", deleteUser)

module.exports = router