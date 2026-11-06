const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            default: ""
        },

        profilePicture: {
            type: String,
            default: ""
        },

        isOnline: {
            type: Boolean,
            default: false
        },

        lastSeen: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);