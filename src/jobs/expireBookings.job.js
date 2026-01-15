const cron = require("node-cron");
const bookingModel = require("../models/booking.model");

cron.schedule("*/5 * * * *", async () => {
    try {
        const expiryTime = new Date(Date.now() - 30 * 60 * 1000);

        const result = await bookingModel.updateMany(
            {
                bookingStatus: "Pending",
                createdAt: { $lt: expiryTime }
            },
            { bookingStatus: "Cancelled" }
        );

        if(result.modifiedCount > 0) {
            console.log(`Expired ${result.modifiedCount} bookings`);
        }
    } catch (error) {
        console.error("Auto-expire booking job failed: ", error);
    }
});