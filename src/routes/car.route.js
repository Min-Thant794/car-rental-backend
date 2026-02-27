const express = require('express');
const router = express.Router();
const { getAllCarModel, createCarModel, updateCarModel, deleteCarModel, getCarById, getCarByDiscount } = require("../controllers/car.controller");
const upload = require("../config/multer");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

router.get("/", auth, getAllCarModel);
router.get("/discount-car", auth, getCarByDiscount);
router.get("/:id", auth, getCarById);
router.post("/create-car", auth, adminOnly, upload.single("carImageUrl"), createCarModel);
router.put("/:id", auth, adminOnly, upload.single("carImageUrl"), updateCarModel);
router.delete("/:id", auth, adminOnly, deleteCarModel);

module.exports = router