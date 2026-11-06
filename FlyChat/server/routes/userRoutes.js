const express = require("express");
const router = express.Router();

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { name, profilePicture } = req.body;
        if (name !== undefined && !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, profilePicture },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get("/search", authMiddleware, async (req, res) => {
    try {
        const search = req.query.q;

        if (!search || !search.trim()) {
            return res.status(400).json({
                success: false,
                message: "Enter a name or email to search"
            });
        }

        const users = await User.find({
            _id: { $ne: req.user.id },
            $or: [
                { name: { $regex: search.trim(), $options: "i" } },
                { email: { $regex: search.trim(), $options: "i" } }
            ]
        })
            .select("name email profilePicture isOnline")
            .limit(10);

        res.json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;