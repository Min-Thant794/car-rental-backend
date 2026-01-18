const express = require("express");
const router = express.Router();
const { getAllBooking, getMyBooking, createBooking, updateMyBooking, deleteBooking, updateBookingAdmin, deleteMyBooking } = require("../controllers/booking.controller");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const customerAccess = require("../middleware/customerAccess");
const verifiedCustomerOnly = require("../middleware/verifyCustomer");

router.get("/", auth, adminOnly, getAllBooking);
router.get("/my-bookings", auth, customerAccess, getMyBooking);
router.post("/", auth, customerAccess, verifiedCustomerOnly, createBooking);
router.patch("/update-my-booking/:id", auth, customerAccess, verifiedCustomerOnly, updateMyBooking);
router.patch("/:id", auth, adminOnly, updateBookingAdmin);
router.delete("/delete-my-bookings/:id", auth, customerAccess, verifiedCustomerOnly, deleteMyBooking);
router.delete("/:id", auth, adminOnly,deleteBooking);

module.exports = router;