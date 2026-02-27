const recomputeCarAvailability = async (carId) => {
  const now = new Date();

  const car = await carModel.findById(carId);
  if (!car) return null;

  if (car.availabilityStatus === "Maintenance") {
    return car;
  }

  const activeBookingExists = await bookingModel.exists({
    carId,
    bookingStatus: { $in: ["Pending", "Confirmed"] },
    endDate: { $gt: now }
  });

  car.availabilityStatus = activeBookingExists ? "Unavailable" : "Available";
  await car.save();

  return car;
};

module.exports={
    recomputeCarAvailability
};