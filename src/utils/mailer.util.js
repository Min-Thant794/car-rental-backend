const nodeMailer = require("nodemailer");
const config = require("../config/config");
const { bookingConfirmedTemplate } = require("../template/bookingConfirmed.template");
const { customerAccountCreation } = require('../template/customerCreation.template')

const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_APP_PASS
    }
});

const sendBookingConfirmedEmail = async (to, booking, car, invoicePath) => {
    const mailOptions = {
        from: `"Let's Drive" <${config.EMAIL_USER}>`,
        to,
        subject: "Booking Confirmed - Invoice Attached",
        html: `<h2>Your booking is confirmed</h2>
               <p>Car: ${car.carName}</p>
               <p>From: ${booking.startDate}</p>
               <p>To: ${booking.endDate}</p>`,
        attachments: invoicePath ? [
            {
                filename: "invoice.pdf",
                path: invoicePath
            }] : []
    };

    await transporter.sendMail(mailOptions);
    console.log("Bookign confirmation email sent to: ", to);
}

const sendBookingCancelledEmail = async (to, booking, car) => {
    const mailOptions = {
        from: `"Let's Drive" <${config.EMAIL_USER}>`,
        to,
        subject: "Your Booking Has Been Cancelled",
        html: `
            <h2>Booking Cancelled</h2>
            <p>Your booking for <b>${car.carName}</b> has been cancelled.</p>

            <hr/>

            <p><b>Booking Details</b></p>
            <p>Start Date: ${new Date(booking.startDate).toDateString()}</p>
            <p>End Date: ${new Date(booking.endDate).toDateString()}</p>
            <p>Total Amount: $${booking.totalPrice}</p>

            <br/>
            <p>If this cancellation was unexpected or you need assistance, please contact our support team.</p>

            <br/>
            <p>— Let's Drive Team</p>
        `
    };

    await transporter.sendMail(mailOptions);
    console.log("Booking cancellation email sent to:", to);
};

const sendBookingCompletedEmail = async (to, booking, car) => {
    const mailOptions = {
        from: `"Let's Drive" <${config.EMAIL_USER}>`,
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

const sendCustomerAccountCreatedEmail = async (to, userName, password, resetLink) => {
    try {
        const mailOptions = {
            from: `"Let's Drive" <${config.EMAIL_USER}>`,
            to,
            subject: "Welcome to Let's Drive - Your Account Details",
            html: customerAccountCreation(userName, password, resetLink)
        };

        await transporter.sendMail(mailOptions);
        console.log("Account creation email sent to: ", to);
    } catch (error) {
        console.error("Failed to send account creation email: ", error);
        throw error;
    }
}

module.exports = { sendBookingConfirmedEmail, sendBookingCompletedEmail, sendBookingCancelledEmail, sendCustomerAccountCreatedEmail }