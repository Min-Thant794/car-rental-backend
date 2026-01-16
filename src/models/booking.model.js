const mongoose = require("mongoose");

const bookingModelSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "customer",
            required: true
        },
        carId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "car",
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        bookingStatus: {
            type: String,
            enum: ["Pending", "Expired", "Confirmed", "Completed", "Cancelled"],
            default: "Pending"
        },
        totalPrice: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("booking", bookingModelSchema);