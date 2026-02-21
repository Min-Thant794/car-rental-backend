const bookingConfirmedTemplate = (booking, car) => `
<div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px">
    <div style="max-width:600px; background:white; margin:auto; padding:20px; border-radius:8px">

        <h2 style="color:#2c3e50">🚗 Booking Confirmed</h2>

        <p>Hi there,</p>
        <p>Great news! Your booking has been confirmed successfully.</p>

        <hr/>

        <h3>Booking Details</h3>
        <p><b>Car:</b> ${car.carName} (${car.brand})</p>
        <p><b>Start Date:</b> ${new Date(booking.startDate).toDateString()}</p>
        <p><b>End Date:</b> ${new Date(booking.endDate).toDateString()}</p>
        <p><b>Total Price:</b> <span style="font-size: 18px; color: #27ae60; font-weight: bold;">$${booking.totalPrice}</span></p>

        <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; color: #333; font-size: 15px;">
                📄 <b>Your invoice is attached</b> to this email. Please review it for your records.
            </p>
        </div>

        <hr/>
        <p style="font-size:12px;color:#777">
        Thank you for choosing Let's Drive. <br/>
        Need help? support@letsdrive.com
        </p>

    </div>
</div>
`;

module.exports = { bookingConfirmedTemplate };