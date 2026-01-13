const express = require('express');
const router = express.Router();
const { getAllCarModel, createCarModel, updateCarModel, deleteCarModel } = require("../controllers/car.controller");
const upload = require("../config/multer");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

router.get("/", auth, adminOnly, getAllCarModel);
router.post("/create-car", auth, adminOnly, upload.single("carImageUrl"), createCarModel);
router.put("/:id", auth, adminOnly, upload.single("carImageUrl"), updateCarModel);
router.delete("/:id", auth, adminOnly, deleteCarModel);

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