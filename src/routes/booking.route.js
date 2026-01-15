const express = require("express");
const router = express.Router();
const { getAllBooking, getMyBooking, createBooking, updateMyBooking, deleteBooking, updateBookingAdmin, deleteMyBooking } = require("../controllers/booking.controller");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const customerAccess = require("../middleware/customerAccess");

router.get("/", auth, adminOnly, getAllBooking);
router.get("/my-bookings", auth, customerAccess, getMyBooking);
router.post("/", auth, customerAccess, createBooking);
router.put("/update-my-booking/:id", auth, customerAccess, updateMyBooking);
router.put("/:id", auth, adminOnly, updateBookingAdmin);
router.delete("/delete-my-bookings/:id", auth, customerAccess, deleteMyBooking);
router.delete("/:id", auth, adminOnly,deleteBooking);

module.exports = router;