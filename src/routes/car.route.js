const express = require('express');
const router = express.Router();
const { getAllCarModel, createCarModel, updateCarModel, deleteCarModel } = require("../controllers/car.controller");
const upload = require("../config/multer");

router.get("/",getAllCarModel);
router.post("/create-car", upload.single("carImageUrl"), createCarModel);
router.put("/:id", upload.single("carImageUrl"), updateCarModel);
router.delete("/:id", deleteCarModel);

// router.post(
//   "/debug",
//   upload.any(),
//   (req, res) => {
//     console.log("DEBUG FILES:", req.files);
//     console.log("DEBUG BODY:", req.body);
//     res.json({ files: req.files, body: req.body });
//   }
// );

module.exports = router