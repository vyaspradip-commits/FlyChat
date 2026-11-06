
const { db } = require("../config/firebase");

const registerChatSocket = (io, socket) => {
    socket.on("join-chat", async ({ chatId }) => {
        try {
            if (!chatId) return;

            socket.join(`chat-${chatId}`);

            socket.emit("chat-joined", {
                success: true,
                chatId
            });
        } catch (error) {
            socket.emit("chat-error", {
                message: "Unable to join chat"
            });
        }
    });

    socket.on("send-message", async (data) => {
        try {
            const {
                chatId,
                senderId,
                message,
                messageType = "text"
            } = data || {};

            if (!chatId || !senderId || !message?.trim()) {
                return socket.emit("chat-error", {
                    message: "Chat ID, sender ID and message are required"
                });
            }

            const messageData = {
                chatId,
                senderId,
                message: message.trim(),
                messageType,
                createdAt: new Date().toISOString(),
                isSeen: false
            };

            const messageRef = await db.collection("messages").add(messageData);

            const savedMessage = {
                id: messageRef.id,
                ...messageData
            };

            io.to(`chat-${chatId}`).emit("new-message", savedMessage);
        } catch (error) {
            socket.emit("chat-error", {
                message: "Failed to send message"
            });
        }
    });

    socket.on("typing", ({ chatId, userId } = {}) => {
        if (!chatId || !userId) return;

        socket.to(`chat-${chatId}`).emit("user-typing", {
            chatId,
            userId
        });
    });

    socket.on("stop-typing", ({ chatId, userId } = {}) => {
        if (!chatId || !userId) return;

        socket.to(`chat-${chatId}`).emit("user-stop-typing", {
            chatId,
            userId
        });
    });

    socket.on("mark-message-seen", async ({ messageId, chatId } = {}) => {
        try {
            if (!messageId || !chatId) return;

            await db.collection("messages").doc(messageId).update({
                isSeen: true,
                seenAt: new Date().toISOString()
            });

            io.to(`chat-${chatId}`).emit("message-seen", {
                messageId,
                chatId,
                isSeen: true
            });
        } catch (error) {
            socket.emit("chat-error", {
                message: "Failed to update message status"
            });
        }
    });
};

module.exports = { registerChatSocket };
