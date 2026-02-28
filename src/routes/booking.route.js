const express = require("express");
const router = express.Router();
const { getAllBooking, getMyBooking, createBooking, updateMyBooking, deleteBooking, updateBookingAdmin, cancelMyBooking } = require("../controllers/booking.controller");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const customerAccess = require("../middleware/customerAccess");
const verifiedCustomerOnly = require("../middleware/verifyCustomer");

router.get("/", auth, adminOnly, getAllBooking);
router.get("/auth/my-bookings", auth, customerAccess, getMyBooking);
router.post("/", auth, customerAccess, verifiedCustomerOnly, createBooking);
router.patch("/update-my-booking/:id", auth, customerAccess, verifiedCustomerOnly, updateMyBooking);
router.patch("/:id", auth, adminOnly, updateBookingAdmin);
router.patch("/cancel-my-booking/:id", auth, customerAccess, verifiedCustomerOnly, cancelMyBooking)
router.delete("/:id", auth, adminOnly,deleteBooking);

module.exports = router;