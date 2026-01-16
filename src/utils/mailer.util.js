const nodeMailer = require("nodemailer");
const config = require("../config/config");

const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_APP_PASS
    }
});

const sendBookingConfirmedEmail = async (to, booking, car) => {
    const mailOptions = {
        from: `"Let's Drive" <${config.EMAIL_USER}>`,
        to,
        subject: "Your Booking is Confirmed!",
        html: `
            <h2>Booking Confirmed!</h2>
            <p>Your Booking has been approved.</p>
            
            <p><strong>Car:</strong> ${car.carName}</p>
            <p><strong>From:</strong> ${new Date(booking.startDate).toDateString()}</p>
            <p><strong>To:</strong> ${new Date(booking.endDate).toDateString()}</p>
            <p><strong>Total Price:</strong> $${booking.totalPrice}</p>

            <br/>
            <p>Thank you for using Let's Drive.</p>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log("Bookign confirmation email sent to: ", to);
}

const sendBookingCompletedEmail = async (to, booking, car) => {
    const mailOptions = {
        from: `"Let's Drive" <${config.EMAIL_USER}`,
        to,
        subject: "Thank you for using Let's Drive!",
        html:`
            <h2>Thank You for Your Booking!</h2>
            <p>Your Booking for <b>${car.carName}</b> has been completed.</p>
            <p>We hope you enjoyed the ride!</p>

            <hr/>

            <p><b>Booking Summary</b></p>
            <p>Start Date: ${new Date(booking.startDate).toDateString()}</p>
            <p>End Date: ${new Date(booking.endDate).toDateString()}</p>
            <p>Total Paid: $${booking.totalPrice}</p>
            
            <br/>
            <p>We look forward to serving you again!</p>
            <p>— Let's Drive Team</p>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log("Compeltion email sent to: ", to);
}

module.exports = { sendBookingConfirmedEmail, sendBookingCompletedEmail }