const mongoose = require("mongoose");
const carModel = require("../models/car.model");
const bookingModel = require("../models/booking.model");

const recomputeCarAvailability = async (carId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(carId)) return null;

    const now = new Date();

    const car = await carModel.findById(carId);
    if (!car) return null;

    if (car.availabilityStatus === "Maintenance") return car;

    const activeBookingExists = await bookingModel.exists({
      carId: car._id,
      bookingStatus: { $in: ["Pending", "Confirmed"] },
      endDate: { $gt: now },
    });

    const nextStatus = activeBookingExists ? "Unavailable" : "Available";

    if (car.availabilityStatus !== nextStatus) {
      car.availabilityStatus = nextStatus;
      await car.save();
    }

    return car;
  } catch (err) {
    console.log("Error in recomputeCarAvailability():", err);
    return null;
  }
};

module.exports = { recomputeCarAvailability };