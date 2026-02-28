const cron = require("node-cron");
const bookingModel = require("../models/booking.model");
const customerModel = require("../models/customer.model");
const userModel = require("../models/user.model");
const carModel = require("../models/car.model");
const { sendBookingCompletedEmail } = require("../utils/mailer.util");

cron.schedule("0 * * * *", async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookingsToComplete = await bookingModel.find({
      bookingStatus: "Confirmed",
      endDate: { $lt: today },
    });

    let completedCount = 0;

    for (const booking of bookingsToComplete) {
      const updated = await bookingModel.updateOne(
        { _id: booking._id, bookingStatus: "Confirmed" },
        { $set: { bookingStatus: "Completed" } }
      );

      if (updated.modifiedCount === 0) continue;

      completedCount++;

      const customer = await customerModel.findById(booking.customerId);
      if (!customer) continue;

      const user = await userModel.findById(customer.userId);
      if (!user?.email) continue;

      const car = await carModel.findById(booking.carId);
      if (!car) continue;

      await sendBookingCompletedEmail(user.email, booking, car);
    }

    if (completedCount > 0) {
      console.log(`Completed ${completedCount} bookings and sent emails`);
    }

    console.log("Booking completion cron tick:", new Date().toISOString());

  } catch (error) {
    console.error("Auto-complete booking job failed:", error);
  }
});