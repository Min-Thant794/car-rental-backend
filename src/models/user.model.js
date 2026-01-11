const mongoose = require('mongoose');

const userModelSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["Admin", "Customer"],
        default: "Customer"
    },
    profileImageUrl: {
        type: String,
        required: false
    },
    accountStatus: {
        type: String,
        enum: ["active", "suspended", "deleted"],
        default: "active"
    },
    active: {
        type: Boolean,
        default: true
    }
},{
    timestamps: true
}
)

module.exports = mongoose.model('user', userModelSchema);