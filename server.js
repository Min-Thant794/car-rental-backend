const express = require('express');
const app = express();
const mongoose = require("mongoose");
require('dotenv').config();
require("./src/jobs/expireBookings.job");
const config = require("./src/config/config")
const port = config.PORT
const mongodb_url = config.MONGODB_URL
const cors = require('cors');
const { testSupabaseConnection } = require("./src/config/supabase");
const cookieParser = require('cookie-parser');

const userRoute = require("./src/routes/user.route");
const carRoute = require("./src/routes/car.route");
const bookingRoute = require("./src/routes/booking.route");

testSupabaseConnection();

app.use(cors({
    origin: [
        "http://localhost:8100"
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () =>{
    console.log(`Server is listening at http://localhost:${port}`);
});

app.get('/', (req, res) => {
    res.send("API start working!");
});

app.use(cookieParser());
app.use("/api/v1/user", userRoute);
app.use("/api/v1/cars", carRoute);
app.use("/api/v1/bookings", bookingRoute);

mongoose.connect(mongodb_url).then(() => {
    console.log("MongoDB is successfully connected!");
});