const cron = require("node-cron");
const bookingModel = require("../models/booking.model");
const { getIo } = require("../utils/socket");

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const result = await bookingModel.updateMany(
      { bookingStatus: "Pending", endDate: { $lte: now } },
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