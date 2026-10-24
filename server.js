const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

require("dotenv").config();
const crypto = require("crypto");
const { Resend } = require("resend");
const { type } = require("os");
const { profile } = require("console");
const e = require("express");
const { findSourceMap } = require("module");
const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();
app.use(express.json({limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
const pendingOtps = new Map();

const chatDataFile = path.join(__dirname, "chat-data.json");
const userDataFile = path.join(__dirname, "users-data.json");
const groupDataFile = path.join(__dirname, "groups-data.json");
if (!fs.existsSync(chatDataFile)) {
    fs.writeFileSync(chatDataFile,JSON.stringify({}, null, 2));
}
function loadChatData() {
    try{
        const data = fs.readFileSync(chatDataFile,"utf8");
        return JSON.parse(data);
    } catch (error){
        console.error("Could not read chat data:", error);
        return{};
    }
}

function saveChatData(data) {
    fs.writeFileSync(chatDataFile, JSON.stringify(data, null, 2));
}
function loadUsersData(){
    try{
        if (!fs.existsSync(userDataFile)) {
            fs.writeFileSync(userDataFile, "[]");
        }
        const data = fs.readFileSync(userDataFile, "utf8");
        return JSON.parse(data || "[]");
    }catch (error){
        console.error("Error loading users:",error);
        return [];
    }
}

function saveUsersData(users){
    fs.writeFileSync(userDataFile, JSON.stringify(users, null, 2));
}

function loadGroupsData(){
    try{
        if (!fs.existsSync(groupDataFile)) {
            fs.writeFileSync(groupDataFile, "[]");
        }
        const data = fs.readFileSync(groupDataFile, "utf8");
        return JSON.parse(data || "[]");
    } catch (error){
        console.error("Load groups data error:", error);
        return [];
    }
}

function saveGroupsData(groups){
    fs.writeFileSync(groupDataFile, JSON.stringify(groups, null, 2));
}
const OTP_EXPIRY = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
function generateOtp() {
    return crypto
        .randomInt(0,1000000)
        .toString()
        .padStart(6, "0");
}

function hashOtp(email, otp) {
    return crypto
        .createHmac("sha256", process.env.OTP_HASH_SECRET)
        .update(`${email.toLowerCase()}:${otp}`)
        .digest("hex");
}

app.post("/api/auth/request-otp", async (req, res) => {
    const email = req.body?.email?.trim().toLowerCase();
    
    if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
    return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
    });
    }

    if (!process.env.RESEND_API_KEY || !process.env.OTP_HASH_SECRET || !process.env.OTP_FROM_EMAIL) {
        return res.status(500).json({
            success: false,
            message: "Email verification is not configured."
        });        
    }

    const otp = generateOtp();

    try{
        const { data, error } = await resend.emails.send({
            from: `FlyChat <${process.env.OTP_FROM_EMAIL}>`,
            to: [email],
            subject: "Your FlyChat verification code",
            html: `
                <h2>Verify your FlyChat email</h2>
                <p>Your verification code is:</p>
                <h1 style="letter-spacing: 8px;">${otp}</h1>
                <p>This code expires in 10 minutes.</p>
                <p>Never share this code with anyone.</p>
            `
        });
        
        if (error) {
            console.error("Resend error:", error);
            return res.status(502).json({
                success: false,
                message: "Could not send the email."
            });
        }

        pendingOtps.set(email, {
            otpHash: hashOtp(email, otp),
            expiresAt: Date.now() + OTP_EXPIRY,
            attempts: 0
        });

        return res.json({
            success: true,
            message: "Verification code sent to your email."
        });
    } catch (error) {
        console.error("Email sending failed:", error);

        return res.status(500).json({
            success:false,
            message: "Something went wrong while sending the email."
        });
    }
});

app.post("/api/auth/verify-otp", (req, res) => {
    const email = req.body?.email;
    const otp = req.body?.otp;

    if (typeof email !== "string" || typeof otp !== "string") {
        return res.status(400).json({
            success: false,
            message: "Enter a valid email and 6-digit OTP."
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
        !/^\d{6}$/.test(otp)
    ) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid email and 6-digit OTP."
        });
    }
    const record = pendingOtps.get(normalizedEmail);

    if (!record) {
        return res.status(400).json({
            success: false,
            message: "No pending OTP. Request a new one."
        });
    }

    if (Date.now() > record.expiresAt) {
        pendingOtps.delete(normalizedEmail);
        return res.status(400).json({
            success: false,
            message: "OTP expired. Request a new code."
        });
    }

    record.attempts++;

    if (record.attempts > MAX_OTP_ATTEMPTS) {
        pendingOtps.delete(normalizedEmail);
        return res.status(429).json({
            success: false,
            message: "Too many attempts. Request a new code."
        });
    }

    const submittedHash = hashOtp(normalizedEmail, otp);

    const submittedBuffer = Buffer.from(submittedHash, "hex");
    const savedBuffer = Buffer.from(record.otpHash,"hex");
    const isCorrect = submittedBuffer.length === savedBuffer.length && crypto.timingSafeEqual(submittedBuffer, savedBuffer);

    if (!isCorrect) {
        return res.status(400).json({
            success: false,
            message: "Incorrect OTP. Please try again."
        });
    }

    pendingOtps.delete(normalizedEmail);
    
    return res.json({
        success: true,
        verified: true,
        message: "Email verified succcessfully."
    });
});

app.post("/api/chat/send", (req, res) => {

    const senderEmail =
        req.body?.senderEmail?.trim().toLowerCase();

    const receiverEmail =
        req.body?.receiverEmail?.trim().toLowerCase();

    const text =
        typeof req.body?.text === "string"
            ? req.body.text.trim()
            : "";

    const file =
        req.body?.file || null;


    // =========================
    // VALIDATION
    // =========================

    if (!senderEmail || !receiverEmail) {

        return res.status(400).json({
            success: false,
            message: "Sender and receiver are required."
        });

    }

    // Must have either text OR file
    if (!text && !file) {

        return res.status(400).json({
            success: false,
            message: "Message or file is required."
        });

    }


    // =========================
    // CHAT KEY
    // =========================

    const emails =
        [senderEmail, receiverEmail].sort();

    const chatKey =
        emails[0] + "_" + emails[1];


    const chats =
        loadChatData();


    if (!chats[chatKey]) {
        chats[chatKey] = [];
    }


    // =========================
    // CREATE MESSAGE
    // =========================

    const message = {

        id:
            Date.now().toString(),

        senderEmail:
            senderEmail,

        receiverEmail:
            receiverEmail,

        text:
            text,

        time:
            new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),

        date:
            new Date().toLocaleDateString(),

        status:
            "sent"

    };


    // =========================
    // FILE MESSAGE
    // =========================

    if (file) {

        message.file = {

            name:
                file.name || "Unknown file",

            filename:
                file.filename || "",

            url:
                file.url || "",

            size:
                Number(file.size) || 0,

            type:
                file.type || "application/octet-stream"

        };

    }


    // =========================
    // SAVE MESSAGE
    // =========================

    chats[chatKey].push(message);

    saveChatData(chats);


    console.log(
        "Message saved:",
        message
    );


    // =========================
    // RESPONSE
    // =========================

    return res.json({

        success: true,

        message:
            message

    });

});

app.post("/api/chat/delivered", (req, res) => {

    try {

        const userEmail =
            req.body?.userEmail?.trim().toLowerCase();

        const senderEmail =
            req.body?.senderEmail?.trim().toLowerCase();

        if (!userEmail || !senderEmail) {

            return res.status(400).json({
                success: false,
                message: "User emails are required."
            });

        }

        const emails = [
            userEmail,
            senderEmail
        ].sort();

        const chatKey =
            emails[0] + "_" + emails[1];

        const chats =
            loadChatData();

        const messages =
            chats[chatKey] || [];

        let changed = false;

        messages.forEach(function(message) {

            const messageReceiver =
                typeof message.receiverEmail === "string"
                    ? message.receiverEmail.toLowerCase()
                    : "";

            const messageSender =
                typeof message.senderEmail === "string"
                    ? message.senderEmail.toLowerCase()
                    : "";

            if (
                messageReceiver === userEmail &&
                messageSender === senderEmail &&
                (
                    !message.status ||
                    message.status === "sent"
                )
            ) {

                message.status = "delivered";

                changed = true;
            }

        });

        if (changed) {
            saveChatData(chats);
        }

        return res.json({
            success: true,
            message: "Messages marked as delivered."
        });

    }
    catch (error) {

        console.error(
            "Delivered status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Could not update delivered status."
        });

    }

});

app.post("/api/chat/read", (req, res) => {

    try {

        const userEmail =
            req.body?.userEmail?.trim().toLowerCase();

        const senderEmail =
            req.body?.senderEmail?.trim().toLowerCase();

        if (!userEmail || !senderEmail) {

            return res.status(400).json({
                success: false,
                message: "User emails are required."
            });

        }

        const emails = [
            userEmail,
            senderEmail
        ].sort();

        const chatKey =
            emails[0] + "_" + emails[1];

        const chats =
            loadChatData();

        const messages =
            chats[chatKey] || [];

        let changed = false;

        messages.forEach(function(message) {

            const messageReceiver =
                typeof message.receiverEmail === "string"
                    ? message.receiverEmail.toLowerCase()
                    : "";

            const messageSender =
                typeof message.senderEmail === "string"
                    ? message.senderEmail.toLowerCase()
                    : "";

            if (
                messageReceiver === userEmail &&
                messageSender === senderEmail &&
                (
                    message.status === "sent" ||
                    message.status === "delivered"
                )
            ) {

                message.status = "read";

                changed = true;
            }

        });

        if (changed) {
            saveChatData(chats);
        }

        return res.json({
            success: true,
            message: "Messages marked as read."
        });

    }
    catch (error) {

        console.error(
            "Read status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Could not update read status."
        });

    }

});

app.get("/api/chat/messages", (req, res) => {
    const userEmail = req.query.userEmail?.trim().toLowerCase();
    const otherEmail = req.query.otherEmail?.trim().toLowerCase();
    if (!userEmail || !otherEmail) {
        return res.status(400).json({
            success: false,
            message: "Both email addresses are required."
        });
    }
    const emails = [
        userEmail,
        otherEmail
    ].sort();
    const chatKey = emails[0] + "_" + emails[1];
    const chats = loadChatData();
    const messages = chats[chatKey] || [];

    return res.json({
        success: true,
        messages: messages
    });
});

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive : true});
}

const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function(req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});

const upload = multer({storage, limits: {fileSize: 15 * 1024 * 1024}});
app.use("/uploads", express.static(uploadDir));
app.post("/api/chat/upload", (req, res) => {
    upload.single("file")(req, res, (uploadError) => {
        if(uploadError){
            if (uploadError.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File size must be less than 15 MB."
                });
            }
            console.error("Upload error:", uploadError);
            return res.status(400).json({
                success: false,
                message: "Unable to upload file."
            });
        }
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file selected."
            });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        console.log("File uploaded:", {
            originalName: req.file.originalname,
            filename: req.file.filename,
            url: fileUrl,
            size: req.file.size
        });
        return res.json({
            success: true,
            message: "File uploaded successfully.",
            file: {
                name: req.file.originalname,
                filename: req.file.filename,
                url: fileUrl,
                size: req.file.size,
                type: req.file.mimetype
            }
        });
    });
});

// =========================
// SEND FILE MESSAGE
// =========================

app.post("/api/chat/send-file", (req, res) => {

    const senderEmail =
        req.body?.senderEmail?.trim().toLowerCase();

    const receiverEmail =
        req.body?.receiverEmail?.trim().toLowerCase();

    const fileName =
        req.body?.fileName?.trim();

    const fileUrl =
        req.body?.fileUrl?.trim();

    const fileSize =
        req.body?.fileSize || 0;


    if (
        !senderEmail ||
        !receiverEmail ||
        !fileName ||
        !fileUrl
    ) {

        return res.status(400).json({

            success: false,

            message:
                "Sender, receiver and file information are required."

        });

    }


    const emails = [
        senderEmail,
        receiverEmail
    ].sort();


    const chatKey =
        emails[0] + "_" + emails[1];


    const chats =
        loadChatData();


    if (!chats[chatKey]) {

        chats[chatKey] = [];

    }


    const message = {

        id:
            Date.now().toString(),

        senderEmail:
            senderEmail,

        receiverEmail:
            receiverEmail,

        type:
            "file",

        fileName:
            fileName,

        fileUrl:
            fileUrl,

        fileSize:
            fileSize,

        time:
            new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            }),

        date:
            new Date().toLocaleDateString(),

        status:
            "sent"

    };


    chats[chatKey].push(message);

    saveChatData(chats);


    return res.json({

        success: true,

        message:
            message

    });

});
app.get("/api/users", (req, res) => {
    try{
        const users = loadUsersData();
        const publicUsers= users.map(function(user){
            return{
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage || "images/user.png",
                status: user.status || "Hey there! I am using FlyChat."
            };
        });
        return res.json({
            success: true,
            users: publicUsers
        });
    } catch (error) {
        console.error("Load users error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not load users."
        });
    }
});

app.post("/api/users/migrate", (req, res) => {
    try {
        const incomingUsers = req.body?.users;

        if (!Array.isArray(incomingUsers)) {
            return res.status(400).json({
                success: false,
                message: "Users array is required."
            });
        }

        const users = loadUsersData();

        let added = 0;
        let updated = 0;

        incomingUsers.forEach(function (incomingUser) {

            if (
                !incomingUser ||
                !incomingUser.email
            ) {
                return;
            }

            const email =
                incomingUser.email
                    .trim()
                    .toLowerCase();

            let index = users.findIndex(function (user) {
                return (
                    user.email &&
                    user.email
                        .trim()
                        .toLowerCase() === email
                );
            });

            const user = {
                id: incomingUser.id || generateID(),
                name: incomingUser.name || "User",
                email: email,
                password: incomingUser.password || "",
                profileImage:
                    incomingUser.profileImage ||
                    "images/user.png",
                status:
                    incomingUser.status ||
                    "Hey there! I am using FlyChat."
            };

            if (index === -1) {

                users.push(user);
                added++;

            } else {

                // Preserve the server user's ID
                user.id = users[index].id;

                users[index] = {
                    ...users[index],
                    ...user
                };

                updated++;
            }
        });

        saveUsersData(users);

        return res.json({
            success: true,
            message: "Users migrated successfully.",
            added: added,
            updated: updated,
            total: users.length
        });

    } catch (error) {

        console.error(
            "User migration error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Could not migrate users."
        });
    }
});

app.get("/api/groups", (req, res) => {

    try {

        const userId =
            String(req.query.userId || "").trim();

        if (!userId) {

            return res.status(400).json({
                success: false,
                message: "User ID is required."
            });

        }

        const groups =
            loadGroupsData();

        const userGroups =
            groups.filter(function(group) {

                return (
                    Array.isArray(group.members) &&
                    group.members.some(function(memberId) {

                        return String(memberId) === userId;

                    })
                );

            });

        return res.json({

            success: true,

            groups: userGroups

        });

    } catch (error) {

        console.error(
            "Load groups error:",
            error
        );

        return res.status(500).json({

            success: false,

            message: "Could not load groups."

        });

    }

});

app.post("/api/groups", (req, res) => {

    try {

        const group =
            req.body;

        if (!group) {

            return res.status(400).json({
                success: false,
                message: "Group data is required."
            });

        }

        if (
            !group.id ||
            !group.name ||
            !group.creatorId
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Group ID, name and creator are required."
            });

        }

        if (
            !Array.isArray(group.members) ||
            group.members.length < 2
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "A group must have at least 2 members."
            });

        }

        const groups =
            loadGroupsData();

        const existingGroup =
            groups.find(function(existing) {

                return String(existing.id) ===
                    String(group.id);

            });

        if (existingGroup) {

            return res.status(409).json({
                success: false,
                message: "Group already exists."
            });

        }

        groups.push(group);

        saveGroupsData(groups);

        console.log(
            "Group created:",
            group.name,
            group.id
        );

        return res.json({

            success: true,

            message:
                "Group created successfully.",

            group: group

        });

    } catch (error) {

        console.error(
            "Create group error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not create group."

        });

    }

});

app.put("/api/groups/:id", (req, res) => {

    try {

        const groupId =
            String(req.params.id);

        const updatedGroup =
            req.body;

        const groups =
            loadGroupsData();

        const index =
            groups.findIndex(function(group) {

                return String(group.id) === groupId;

            });

        if (index === -1) {

            return res.status(404).json({

                success: false,

                message: "Group not found."

            });

        }

        const existingGroup =
            groups[index];

        if (
            String(existingGroup.creatorId) !==
            String(updatedGroup.creatorId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Only the group creator can edit this group."

            });

        }

        groups[index] = {

            ...existingGroup,

            ...updatedGroup,

            id: existingGroup.id,

            creatorId: existingGroup.creatorId

        };

        saveGroupsData(groups);

        console.log(
            "Group updated:",
            groups[index].name
        );

        return res.json({

            success: true,

            message:
                "Group updated successfully.",

            group: groups[index]

        });

    } catch (error) {

        console.error(
            "Update group error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not update group."

        });

    }

});
// =========================
// UPDATE USER PROFILE
// =========================

const groupMessagesDataFile = path.join(__dirname, "group-messages-data.json");
function loadGroupMessagesData(){
    try{
        if (!fs.existsSync(groupMessagesDataFile)) {
            fs.writeFileSync(groupMessagesDataFile, JSON.stringify({}, null, 2));
        }
        return JSON.parse(fs.readFileSync(groupMessagesDataFile, "utf8"));
    } catch (error) {
        console.error("Load group messages error:",error);
        return{};
    }
}

function saveGroupMessagesData(data) {
    fs.writeFileSync(groupMessagesDataFile, JSON.stringify(data, null, 2));
}

app.get("/api/groups/:groupId/messages", (req, res) => {
    try {
        const groupId = String(req.params.groupId || "").trim();
        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group ID is required."
            });
        }
        const messagesData = loadGroupMessagesData();
        const messages = messagesData[groupId] || [];
        return res.json({
            success: true,
            messages: messages
        });
    } catch (error) {
        console.error("Load group messages error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not load group messages."
        });
    }
});

app.post("/api/groups/:groupId/messages", (req, res) => {

    try {

        const groupId =
            String(req.params.groupId || "").trim();

        const {
            senderId,
            senderEmail,
            senderName,
            text
        } = req.body;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group ID is required."
            });
        }

        if (!senderId || !senderEmail || !text) {
            return res.status(400).json({
                success: false,
                message: "Sender and message are required."
            });
        }

        const messagesData =
            loadGroupMessagesData();

        if (!messagesData[groupId]) {
            messagesData[groupId] = [];
        }

        const now = new Date();

        const message = {

            id: generateID(),

            senderId: senderId,

            senderEmail:
                String(senderEmail)
                    .trim()
                    .toLowerCase(),

            senderName:
                senderName || "Unknown",

            text: text.trim(),

            time:
                now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                }),

            date:
                now.toLocaleDateString(),

            status: "sent"
        };

        messagesData[groupId].push(message);

        saveGroupMessagesData(
            messagesData
        );

        return res.json({
            success: true,
            message: message
        });

    } catch (error) {

        console.error(
            "Send group message error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Could not send group message."
        });
    }
});

app.post("/api/users/update", (req, res) => {
    try {
        const {
            id,
            email,
            name,
            status,
            profileImage
        } = req.body;

        if (!id && !email) {
            return res.status(400).json({
                success: false,
                message: "User ID or email is required."
            });
        }

        const users = loadUsersData();

        // Find by ID first
        let index = -1;

        if (id) {
            index = users.findIndex(function (user) {
                return String(user.id) === String(id);
            });
        }

        // If ID doesn't match, find by email
        if (index === -1 && email) {
            index = users.findIndex(function (user) {
                return (
                    user.email &&
                    user.email.toLowerCase().trim() ===
                    email.toLowerCase().trim()
                );
            });
        }

        if (index === -1) {
            console.log("User not found for update:", {
                id: id,
                email: email
            });

            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Update only profile fields
        users[index].name = name || users[index].name;
        users[index].status =
            status !== undefined
                ? status
                : users[index].status;

        if (profileImage) {
            users[index].profileImage = profileImage;
        }

        saveUsersData(users);

        console.log("Profile updated:", users[index]);

        return res.json({
            success: true,
            message: "Profile updated successfully.",
            user: {
                id: users[index].id,
                name: users[index].name,
                email: users[index].email,
                profileImage:
                    users[index].profileImage ||
                    "images/user.png",
                status:
                    users[index].status ||
                    "Hey there! I am using FlyChat."
            }
        });

    } catch (error) {
        console.error("Profile update error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not update profile."
        });
    }
});

app.post("/api/users/register", (req, res) => {

    const name = req.body?.name?.trim();
    const email = req.body?.email?.trim().toLowerCase();
    const password = req.body?.password;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email and password are required."
        });
    }

    const usersFile = path.join(__dirname, "users-data.json");

    let users = [];

    if (fs.existsSync(usersFile)) {
        try {
            users = JSON.parse(
                fs.readFileSync(usersFile, "utf8")
            );
        } catch (error) {
            users = [];
        }
    }

    const exists = users.find(user =>
        String(user.email).toLowerCase() === email
    );

    if (exists) {
        return res.status(409).json({
            success: false,
            message: "Email already registered."
        });
    }

    const user = {
        id: "user_" + Date.now().toString(36),
        name: name,
        email: email,
        profileImage: "images/user.png",
        status: "Hey there! I am using FlyChat."
    };

    users.push(user);

    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );

    console.log("New user registered:", user);

    return res.json({
        success: true,
        user: user
    });
});
app.use(express.static(path.join(__dirname, "client")));
app.use("/upload", upload.single("file"), (req, res) => {
    if (!req.file){
        return res.status(400).json({
            sucsess: false,
            message: "No file uploaded"
        });
    }

    res.json({
        success: true,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html"));
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`FlyChat Server running on http://localhost:${PORT}`);
    console.log(`FlyChat Server available on your network at port ${PORT}`);
});