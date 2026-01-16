const mongoose = require("mongoose");

const carModelSchema = new mongoose.Schema({
    carName: {
        type: String,
        unique: true,
        required: true
    },
    description: {
        type: String,
        default: "N/A",
        required: false
    },
    carImageUrl: {
        type: String,
        required: true
    },
    fuelType: {
        type: String,
        enum: ["Diesel", "Electric", "Petrol"],
        required: true
    },
    vechicleType: {
        type: String,
        required: false
    },
    pricePerDay: {
        type: Number,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    availabilityStatus: {
        type: String,
        enum: ["Available", "Unavailable", "Maintenance"],
        required: false
    },
}, {
    timestamps: true
});

module.exports = mongoose.model("car", carModelSchema);