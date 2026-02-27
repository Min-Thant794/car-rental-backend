const mongoose = require("mongoose");

const carModelSchema = new mongoose.Schema({
    carName: {
        type: String,
        required: true,
        index: true
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
        required: true,
        index: true
    },
    vehicleType: {
        type: String,
        enum: ["Crossover", "Sedan", "SUV", "MPV", "Hatchback", "Station Wagon"],
        required: true
    },
    seater: {
        type: Number,
        enum: [4, 5, 6, 7],
        required: true
    },
    pricePerDay: {
        type: Number,
        required: true,
        min: 1
    },
    discount: {
        type: Number,
        enum: [0, 10, 15, 20, 30, 35, 40, 45, 50],
        default: 0
    },
    brand: {
        type: String,
        required: true,
        index: true
    },
    availabilityStatus: {
        type: String,
        enum: ["Available", "Unavailable", "Maintenance"],
        default: "Available",
        index: true
    },
}, {
    timestamps: true
});

carModelSchema.virtual("discountedPrice").get(function () {
    if(!this.discount || this.discount === 0) {
        return this.pricePerDay;
    }

    return Number((this.pricePerDay - (this.pricePerDay * this.discount / 100)).toFixed(2));
});

carModelSchema.set("toJSON", { virtuals: true });
carModelSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("car", carModelSchema);