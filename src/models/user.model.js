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
    phoneNumer: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
        set: v => v === "" ? undefined : v,
        trim: true,
        validate: (
            function(v) {
                return /^\+?[0-9]{7,15}$/.test(v);
            }
        )
    },
    password: {
        type: String,
        required: true
    },
    role: {
        enum: ["Admin", "Customer"],
        required: true
    },
    profileImageUrl: {
        type: String,
        required: false
    },
    licenseImageUrl: {
        type: String,
        required: true
    },
    allowedPath: {
        type: [String],
        required: true
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