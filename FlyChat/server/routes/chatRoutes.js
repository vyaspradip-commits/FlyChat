const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const chatController = require("../controllers/chatController");
const upload = require("../middleware/uploadMiddleware");

router.post("/conversations", authMiddleware, chatController.createConversation);
router.post("/messages", authMiddleware, chatController.sendMessage);
router.post(
    "/upload",
    authMiddleware,
    (req, res, next) => {
        upload.single("file")(req, res, (error) => {
            if (error) {
                const message = error.code === "LIMIT_FILE_SIZE"
                    ? "File size must not exceed 5 MB."
                    : "File upload failed. Check the file and try again.";

                return res.status(400).json({
                    success: false,
                    message
                });
            }

            next();
        });
    },
    chatController.uploadFile
);
router.get("/conversations", authMiddleware, chatController.getConversations);
router.get(
    "/conversations/:conversationId/messages",
    authMiddleware,
    chatController.getMessages
);

module.exports = router;