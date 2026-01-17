const cron = require("node-cron");
const bookingModel = require("../models/booking.model");
const { getIo } = require("../utils/socket");

cron.schedule("*/5 * * * *", async () => {
    try {
        const expiryTime = new Date(Date.now() - 30 * 60 * 1000);

        const expiredBookings = await bookingModel.find({
            bookingStatus: "Pending",
            createdAt: {$lt: expiryTime}
        });

        if(expiredBookings) {
            return;
        }

        const expiredIds = expiredBookings.map((booking) => booking._id);

        const result = await bookingModel.updateMany(
            {
                _id: { $in: expiredIds}
            },
            { 
                bookingStatus: "Expired"
            }
        );

        if(result.modifiedCount > 0) {
            console.log(`Expired ${result.modifiedCount} bookings`);
            const io = getIo();
            if(io) {
                io.emit("booking:expired", {
                    bookings: expiredBookings.map((booking) => ({
                        bookingId: booking._id,
                        carId: booking.carId,
                        startDate: booking.startDate,
                        endDate: booking.endDate
                    }))
                });
            }
        }
    } catch (error) {
        console.error("Auto-expire booking job failed: ", error);
    }
});