const bookingConfirmedTemplate = (booking, car) => `
    <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:20px">
    <div style="max-width:600px; background:white; margin:auto; padding:20px; border-radius:8px">

        <h2 style="color:#2c3e50">🚗 Booking Confirmed</h2>

        <p>Your booking has been confirmed successfully.</p>

        <hr/>

        <h3>Car Details</h3>
        <p><b>${car.carName}</b> (${car.brand})</p>

        <h3>Booking Dates</h3>
        <p>
        Start: ${new Date(booking.startDate).toDateString()} <br/>
        End: ${new Date(booking.endDate).toDateString()}
        </p>

        <h3>Total Price</h3>
        <p style="font-size:18px; color:green">$${booking.totalPrice}</p>

        <p>Your invoice is attached with this email.</p>

        <hr/>
        <p style="font-size:12px;color:#777">
        Thank you for choosing Let's Drive. <br/>
        Need help? support@letsdrive.com
        </p>

    </div>
    </div>
    `;

module.exports = {bookingConfirmedTemplate};