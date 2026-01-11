const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true, 
        unique: true,
        sparse: true,
        set: v => v === "" ? undefined : v,
        trim: true,
        validate: (
            function(v) {
                return /^\+?[0-9]{8,15}$/.test(v);
            }
        )
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    licenseImageUrl: {
        type: String,
        required: true
    },
    verificationStatus: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("customer", customerSchema);