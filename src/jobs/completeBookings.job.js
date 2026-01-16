const cron = require("node-cron");
const bookingModel = require("../models/booking.model");
const customerModel = require("../models/customer.model");
const userModel = require("../models/user.model");
const carModel = require("../models/car.model");
const { sendBookingCompletedEmail } = require("../utils/mailer.util");

cron.schedule("0 * * * *", async () => {
    try {
        const now = new Date();
        
        const bookingsToComplete = await bookingModel.find({
            bookingStatus: "Confirmed",
            endDate: {$lt: now}
        });

        for(const booking of bookingsToComplete) {
            booking.bookingStatus = "Completed";
            await booking.save();

            const customer = await customerModel.findById(booking.customerId);
            const user = await userModel.findById(customer.userId);
            const car = await carModel.findById(booking.carId);

            if(user?.email) {
                await sendBookingCompletedEmail(user.email, booking, car);
            }
        }

        if(bookingsToComplete.length > 0) {
            console.log(`Completed ${bookingsToComplete.length} bookings and sent emails`);
        }
    } catch (error) {
        console.error("Auto-complete booking job failed: ", error);
    }
});