const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");


// =========================
// GET PROFILE
// =========================

router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

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


// =========================
// UPDATE PROFILE
// =========================

router.put("/profile", authMiddleware, async (req, res) => {
    try {

        const {
            name,
            email,
            status,
            profilePicture
        } = req.body;


        if (name !== undefined && !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty"
            });
        }


        if (email !== undefined && !String(email).trim()) {
            return res.status(400).json({
                success: false,
                message: "Email cannot be empty"
            });
        }


        const updates = {};


        if (name !== undefined) {
            updates.name = String(name).trim();
        }


        if (email !== undefined) {
            updates.email = String(email)
                .trim()
                .toLowerCase();
        }


        if (status !== undefined) {
            updates.status = String(status).trim();
        }


        if (profilePicture !== undefined) {
            updates.profilePicture = profilePicture;
        }


        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            {
                new: true,
                runValidators: true
            }
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


// =========================
// PROFILE PICTURE UPLOAD
// =========================

router.post(
    "/profile-picture",
    authMiddleware,
    (req, res, next) => {

        upload.single("file")(req, res, (error) => {

            if (error) {

                const message =
                    error.code === "LIMIT_FILE_SIZE"
                        ? "File size must not exceed 5 MB."
                        : "Profile picture upload failed.";

                return res.status(400).json({
                    success: false,
                    message
                });
            }

            next();
        });

    },
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please select an image."
                });
            }


            const user = await User.findById(req.user.id);

            if (!user) {

                const filePath = path.join(
                    __dirname,
                    "../uploads",
                    req.file.filename
                );

                fs.unlink(filePath, () => {});

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }


            const oldPicture = user.profilePicture;


            user.profilePicture =
                "/uploads/" + req.file.filename;


            await user.save();


            // Delete old uploaded picture
            // but don't try to delete the default/empty value.

            if (
                oldPicture &&
                oldPicture.startsWith("/uploads/")
            ) {

                const oldFilePath = path.join(
                    __dirname,
                    "..",
                    oldPicture.replace("/uploads/", "uploads/")
                );

                fs.unlink(oldFilePath, () => {});
            }


            const updatedUser =
                await User.findById(req.user.id)
                    .select("-password");


            return res.status(200).json({
                success: true,
                message: "Profile picture updated successfully",
                user: updatedUser
            });


        } catch (error) {

            if (req.file) {

                const filePath = path.join(
                    __dirname,
                    "../uploads",
                    req.file.filename
                );

                fs.unlink(filePath, () => {});
            }


            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);


// =========================
// SEARCH USERS
// =========================

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

            _id: {
                $ne: req.user.id
            },

            $or: [
                {
                    name: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },

                {
                    email: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                }
            ]

        })
            .select(
                "name email profilePicture status isOnline"
            )
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