const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.createConversation = async (req, res) => {
    try {
        const { participantId, groupName, participantIds } = req.body;

        if (groupName && Array.isArray(participantIds)) {
            const members = [...new Set([
                req.user.id.toString(),
                ...participantIds.map(id => String(id))
            ])];

            if (
                !groupName.trim() ||
                members.length < 2 ||
                members.some(id => !require("mongoose").Types.ObjectId.isValid(id))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "A valid group name and valid member IDs are required"
                });
            }

            const conversation = await Conversation.create({
                participants: members,
                isGroup: true,
                groupName: groupName.trim(),
                createdBy: req.user.id
            });

            return res.status(201).json({
                success: true,
                conversation
            });
        }

        if (
            !participantId ||
            !require("mongoose").Types.ObjectId.isValid(participantId) ||
            participantId.toString() === req.user.id.toString()
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid participant ID different from your own is required"
            });
        }

        const existingConversation = await Conversation.findOne({
            participants: {
                $all: [req.user.id, participantId],
                $size: 2
            },
            isGroup: false
        });

        if (existingConversation) {
            return res.status(200).json({
                success: true,
                conversation: existingConversation
            });
        }

        const conversation = await Conversation.create({
            participants: [req.user.id, participantId],
            isGroup: false,
            createdBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error("Create conversation error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


exports.sendMessage = async (req, res) => {
    try {
        const { conversationId, text } = req.body;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID"
            });
        }

        if (!conversationId || !text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Conversation ID and message text are required"
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: req.user.id,
            text: text.trim()
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const io = req.app.get("io");

        io.to(conversationId).emit("newMessage", message);

        res.status(201).json({
            success: true,
            message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getConversations = async (req, res) => {
    try {
        console.log("Logged-in user ID:", req.user.id);

        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate("participants", "name email profilePicture isOnline")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            conversations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID"
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const messages = await Message.find({
            conversation: conversationId
        })
            .populate("sender", "name profilePicture")
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.uploadFile = async (req, res) => {
    try {
        const { conversationId } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a file"
            });
        }

        if (!conversationId) {
            const fs = require("fs");
            const path = require("path");
            fs.unlink(path.join(__dirname, "../uploads", req.file.filename), () => {});

            return res.status(400).json({
                success: false,
                message: "Conversation ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            const fs = require("fs");
            const path = require("path");
            fs.unlink(path.join(__dirname, "../uploads", req.file.filename), () => {});

            return res.status(400).json({
                success: false,
                message: "Invalid conversation ID"
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });

        if (!conversation) {
            const fs = require("fs");
            const path = require("path");

            if (req.file) {
                const filePath = path.join(__dirname, "../uploads", req.file.filename);
                fs.unlink(filePath, () => {});
            }

            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        const isImage = req.file.mimetype.startsWith("image/");

        const message = await Message.create({
            conversation: conversationId,
            sender: req.user.id,
            text: "",
            imageUrl: "/uploads/" + req.file.filename,
            messageType: isImage ? "image" : "file"
        });

        conversation.lastMessage = message._id;
        await conversation.save();

        const savedMessage = await Message.findById(message._id)
            .populate("sender", "name profilePicture");

        const io = req.app.get("io");
        io.to(conversationId).emit("newMessage", savedMessage);

        return res.status(201).json({
            success: true,
            message: savedMessage
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
