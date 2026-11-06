
const registerSocketEvents = (io, socket) => {
    socket.on("join-room", ({ roomId }) => {
        if (!roomId || typeof roomId !== "string") return;
        socket.join(roomId);
        socket.emit("room-joined", { roomId });
    });

    socket.on("leave-room", ({ roomId }) => {
        if (!roomId || typeof roomId !== "string") return;
        socket.leave(roomId);
        socket.emit("room-left", { roomId });
    });

    socket.on("send-message", (data) => {
        if (!data || !data.roomId || !data.message) return;

        const messageData = {
            ...data,
            createdAt: new Date().toISOString()
        };

        io.to(data.roomId).emit("receive-message", messageData);
    });

    socket.on("typing", ({ roomId, userId }) => {
        if (!roomId || !userId) return;

        socket.to(roomId).emit("user-typing", {
            userId,
            roomId
        });
    });

    socket.on("stop-typing", ({ roomId, userId }) => {
        if (!roomId || !userId) return;

        socket.to(roomId).emit("user-stop-typing", {
            userId,
            roomId
        });
    });

    socket.on("message-seen", ({ roomId, messageId, userId }) => {
        if (!roomId || !messageId || !userId) return;

        io.to(roomId).emit("message-seen-update", {
            messageId,
            userId,
            seenAt: new Date().toISOString()
        });
    });

    socket.on("user-online", ({ userId }) => {
        if (!userId) return;

        socket.broadcast.emit("user-status-changed", {
            userId,
            status: "online"
        });
    });

    socket.on("disconnect", () => {
        socket.broadcast.emit("user-disconnected", {
            socketId: socket.id
        });
    });
};

module.exports = registerSocketEvents;
