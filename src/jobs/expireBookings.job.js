const cron = require("node-cron");
const bookingModel = require("../models/booking.model");
const { getIo } = require("../utils/socket");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    
    const oneHourLater = new Date(now.getTime() - 60 * 60 * 1000);

    const result = await bookingModel.updateMany(
      { bookingStatus: "Pending", startDate: { $lte: oneHourLater } },
      { $set: { bookingStatus: "Expired" } }
    );

    if (result.modifiedCount > 0) {
      console.log(`Expired ${result.modifiedCount} pending bookings`);
      const io = getIo();
      if (io) io.emit("booking:expired", { count: result.modifiedCount });
    }
  } catch (error) {
    console.error("Expire pending bookings cron failed:", error);
  }
});