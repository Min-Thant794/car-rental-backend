const express = require('express');
const http = require("http");
const app = express();
const mongoose = require("mongoose");
require('dotenv').config();
require("./src/jobs/expireBookings.job");
require("./src/jobs/completeBookings.job");
const config = require("./src/config/config");
const port = config.PORT
const mongodb_url = config.MONGODB_URL
const cors = require('cors');
const { testSupabaseConnection } = require("./src/config/supabase");
const cookieParser = require('cookie-parser');
const { initializeSocket } = require("./src/utils/socket");
const { connectRedis } = require("./src/config/redis");

const userRoute = require("./src/routes/user.route");
const carRoute = require("./src/routes/car.route");
const bookingRoute = require("./src/routes/booking.route");

testSupabaseConnection();

const allowedOrigins = [
    "http://localhost:8100",
    "http://localhost:4100",
    "http://localhost:4040",
    "http://localhost:5173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:4173",
    "https://my-project-kohl-rho.vercel.app/",
    "https://www.shopping-pwa.com/"
];

const corsOptions = {
    origin: (origin, callback) => {
    if(!origin) return callback(null, true);

        if(allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS not allowed!"));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = initializeSocket(server, corsOptions);

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

server.listen(port, () => {
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

connectRedis()
    .then(() => console.log("Redis is successfully connected!"))
    .catch((error) => console.log("Redis connection failed:", error));