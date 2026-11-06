const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error.message);
    });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extends: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.use(express.static(path.join(__dirname, "../client")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "Flychat server is working!"
    });
});

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../client/index.html")
    );
});

const PORT = process.env.PORT || 5000;

const http = require("http");
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.set("io", io);

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
        return next(new Error("Authentication required"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        next();
    } catch (error) {
        next(new Error("Invalid or expired token"));
    }
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.join(`user:${socket.userId}`);
    User.findByIdAndUpdate(socket.userId, {
        isOnline: true
    }).catch(console.error);

    socket.on("joinConversation", (conversationId) => {
        socket.join(conversationId);
        console.log("Joined conversation:", conversationId);
    });

    socket.on("disconnect", async () => {
        console.log("User disconnected:", socket.id);

        const sockets = await io.in(`user:${socket.userId}`).fetchSockets();

        if (sockets.length === 0) {
            await User.findByIdAndUpdate(socket.userId, {
                isOnline: false,
                lastSeen: new Date()
            });
        }
    });

    socket.on("sendTestMessage", ({ conversationId, text }) => {
        io.to(conversationId).emit("testMessage", text);
    });
});

server.listen(PORT, () => {
    console.log(`FlyChat server running on port ${PORT}`);
});