const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");
const multer = require("multer");
const fs = require("fs");
function generateID(){
    return crypto.randomUUID();
}
require("dotenv").config();
const crypto = require("crypto");
const { Resend } = require("resend");
const { type } = require("os");
const { profile } = require("console");
const e = require("express");
const { findSourceMap, findPackageJSON } = require("module");
const { json } = require("stream/consumers");
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
// =========================
// REAL-TIME CLIENT CONNECTIONS
// =========================

const realtimeClients = new Set();

function sendRealtimeEvent(type, data) {
    const message = `data: ${JSON.stringify({
        type: type,
        ...data
    })}\n\n`;

    realtimeClients.forEach(function (client) {
        try {
            client.write(message);
        } catch (error) {
            realtimeClients.delete(client);
        }
    });
}

app.get("/api/realtime", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    if (res.flushHeaders) {
        res.flushHeaders();
    }

    realtimeClients.add(res);

    console.log(
        "Realtime client connected. Total:",
        realtimeClients.size
    );

    res.write(
        `data: ${JSON.stringify({
            type: "connected"
        })}\n\n`
    );

    req.on("close", function () {
        realtimeClients.delete(res);

        console.log(
            "Realtime client disconnected. Total:",
            realtimeClients.size
        );
    });
});
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

const passwordResetDataFile = path.join(__dirname, "Password-reset-data.json");
function loadPasswordResetData(){
    try{
        if ((!fs.existsSync(passwordResetDataFile))) {
            fs.writeFileSync(passwordResetDataFile,JSON.stringify({}, null, 2));
        }
        return JSON.parse(fs.readFileSync(passwordResetDataFile, "utf8") || "{}");
    }catch(error){
        console.error("Load password reset data error:",error);
        return {};
    }
}

function savePasswordResetData(data){
    fs.writeFileSync(passwordResetDataFile, JSON.stringify(data, null, 2));
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
    // REAL-TIME MESSAGE EVENT
    // =========================

    sendRealtimeEvent(
        "message-received",
        {
            senderEmail: senderEmail,
            receiverEmail: receiverEmail,
            message: message
        }
    );

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

const upload = multer({storage, limits: {fileSize: 5 * 1024 * 1024}});
app.use("/uploads", express.static(uploadDir));
app.post("/api/chat/upload", (req, res) => {
    upload.single("file")(req, res, (uploadError) => {
        if(uploadError){
            if (uploadError.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File size must be less than 5 MB."
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

    try {

        const viewerId =
            String(req.query.viewerId || "").trim();

        const privacyCandidates =
            req.query.privacyCandidates === "true";

        const users =
            loadUsersData();

        let visibleUsers;

        /*
         * Privacy page needs to see all accounts
         * so the user can choose whom to allow.
         */
        if (privacyCandidates) {

            visibleUsers = users;

        }

        /*
         * Dashboard/search requests are filtered
         * according to the target user's privacy.
         */
        else if (viewerId) {

            visibleUsers =
                users.filter(function (user) {

                    return canViewProfile(
                        viewerId,
                        user.id
                    );

                });

        }

        /*
         * Keep old behaviour if no viewerId
         * was supplied.
         */
        else {

            visibleUsers = users;

        }


        const publicUsers =
            visibleUsers.map(function (user) {

                return {

                    id:
                        user.id,

                    name:
                        user.name,

                    email:
                        user.email,

                    profileImage:
                        user.profileImage ||
                        "images/user.png",

                    status:
                        user.status ||
                        "Hey there! I am using FlyChat."

                };

            });


        return res.json({

            success: true,

            users:
                publicUsers

        });


    } catch (error) {

        console.error(
            "Load users error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not load users."

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
            groups
                .filter(function(group) {

                    return (
                        Array.isArray(group.members) &&
                        group.members.some(function(memberId) {

                            return String(memberId) === userId;

                        })
                    );

                })
                .map(function(group) {

                    const activity =
                        group.lastActivityAt ||
                        group.updatedAt ||
                        group.createdAt ||
                        new Date(0).toISOString();

                    return {

                        ...group,

                        lastActivityAt:
                            group.lastActivityAt ||
                            group.updatedAt ||
                            group.createdAt ||
                            null,

                        updatedAt:
                            group.updatedAt ||
                            group.createdAt ||
                            null,

                        _activityTime:
                            activity

                    };

                })
                .sort(function(a, b) {

                    return (
                        new Date(b._activityTime).getTime() -
                        new Date(a._activityTime).getTime()
                    );

                })
                .map(function(group) {

                    const cleanGroup = {
                        ...group
                    };

                    delete cleanGroup._activityTime;

                    return cleanGroup;

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

            message:
                "Could not load groups."

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


        // =========================
        // CHECK GROUP CREATOR
        // =========================

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


        // =========================
        // UPDATE GROUP
        // =========================

        const now =
            new Date().toISOString();

        groups[index] = {

            ...existingGroup,

            ...updatedGroup,

            // Never allow ID to change
            id:
                existingGroup.id,

            // Never allow creator to change
            creatorId:
                existingGroup.creatorId,

            // IMPORTANT:
            // This makes the edited group the latest activity
            updatedAt:
                now,

            lastActivityAt:
                now

        };


        // =========================
        // SAVE TO SERVER
        // =========================

        saveGroupsData(
            groups
        );


        // =========================
        // REALTIME UPDATE
        // =========================

        sendRealtimeEvent(
            "group-updated",
            {
                groupId:
                    groups[index].id,

                group:
                    groups[index]
            }
        );


        console.log(
            "Group updated:",
            groups[index].name,
            groups[index].id,
            groups[index].lastActivityAt
        );


        // =========================
        // RESPONSE
        // =========================

        return res.json({

            success: true,

            message:
                "Group updated successfully.",

            group:
                groups[index]

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

const privacyDataFile = path.join(__dirname, "privacy-data.json");

function loadPrivacyData() {
    try{
        if (!fs.existsSync(privacyDataFile)) {
            fs.writeFileSync(privacyDataFile, JSON.stringify({}, null, 2));
        }

        return JSON.parse(
            fs.readFileSync(privacyDataFile,"utf8")
        );
    } catch (error){
        console.error("Load privacy data error:", error);
        return {};
    }
}

function savePrivacyData(data){
    fs.writeFileSync(privacyDataFile, JSON.stringify(data, null, 2));
}
function canViewProfile(viewerId, targetUserId) {

    const viewer =
        String(viewerId || "").trim();

    const target =
        String(targetUserId || "").trim();

    // A user can always see their own profile
    if (viewer === target) {
        return true;
    }

    const privacyData =
        loadPrivacyData();

    const privacy =
        privacyData[target];

    // No privacy setting = everyone
    if (!privacy) {
        return true;
    }

    // Everyone
    if (privacy.visibility === "everyone") {
        return true;
    }

    // Selected Accounts
    if (privacy.visibility === "selected") {

        return Array.isArray(privacy.selectedUsers) &&
            privacy.selectedUsers
                .map(String)
                .includes(viewer);
    }

    // Contacts will be connected to chat history separately.
    // For now don't hide users because of this option.
    if (privacy.visibility === "contacts") {
        return true;
    }

    return true;
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
            text,
            type,
            fileName,
            fileUrl,
            fileSize
        } = req.body;

        if (!groupId) {
            return res.status(400).json({
                success: false,
                message: "Group ID is required."
            });
        }

        // Text message validation
        // File messages are allowed without text.
        if (
            !senderId ||
            !senderEmail ||
            (
                (!text || !String(text).trim()) &&
                type !== "file"
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Sender and message are required."
            });
        }

        // File message validation
        if (type === "file") {

            if (!fileName || !fileUrl) {

                return res.status(400).json({
                    success: false,
                    message: "File information is required."
                });
            }
        }

        const messagesData =
            loadGroupMessagesData();

        if (!messagesData[groupId]) {
            messagesData[groupId] = [];
        }

        const now = new Date();

        const message = {

            id: randomUUID(),

            senderId:
                req.body.senderId,

            senderEmail:
                req.body.senderEmail,

            senderName:
                req.body.senderName,

            type:
                type || "text",

            text:
                text ? String(text).trim() : "",

            fileName:
                fileName || "",

            fileUrl:
                fileUrl || "",

            fileSize:
                fileSize || 0,

            time:
                new Date().toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                ),

            date:
                now.toLocaleDateString(),

            status:
                "sent"
        };
        messagesData[groupId].push(message);

        saveGroupMessagesData(
            messagesData
        );
                // =========================
        // UPDATE GROUP ACTIVITY
        // =========================

        const groups =
            loadGroupsData();

        const groupIndex =
            groups.findIndex(function(group) {

                return String(group.id) ===
                    String(groupId);

            });

        if (groupIndex !== -1) {

            const activityTime =
                now.toISOString();

            groups[groupIndex] = {

                ...groups[groupIndex],

                updatedAt:
                    activityTime,

                lastActivityAt:
                    activityTime

            };

            saveGroupsData(groups);

            console.log(
                "Group activity updated:",
                groupId,
                activityTime
            );

            // Tell connected dashboard clients
            // that this group has new activity.

            if (typeof sendRealtimeEvent === "function") {

                sendRealtimeEvent(
                    "group-message",
                    {
                        groupId:
                            groupId,

                        group:
                            groups[groupIndex],

                        message:
                            message
                    }
                );

            }

        }
        console.log(
            "Group message saved:",
            {
                groupId: groupId,
                type: message.type,
                sender: message.senderEmail,
                fileName: message.fileName || null
            }
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
        sendRealtimeEvent("profile-updated", {
            userId: users[index].id,
            user: users[index]
        });
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

    try {

        const name =
            String(req.body?.name || "").trim();

        const email =
            String(req.body?.email || "")
                .trim()
                .toLowerCase();

        const password =
            String(req.body?.password || "");

        if (!name || !email || !password) {

            return res.status(400).json({
                success: false,
                message: "Name, email and password are required."
            });

        }

        const usersFile =
            path.join(__dirname, "users-data.json");

        let users = [];

        if (fs.existsSync(usersFile)) {

            try {

                const fileData =
                    fs.readFileSync(
                        usersFile,
                        "utf8"
                    );

                users =
                    JSON.parse(fileData || "[]");

            } catch (error) {

                console.error(
                    "Error reading users-data.json:",
                    error
                );

                users = [];
            }
        }

        if (!Array.isArray(users)) {
            users = [];
        }

        const exists =
            users.find(function (user) {

                return (
                    user.email &&
                    String(user.email)
                        .trim()
                        .toLowerCase() === email
                );

            });

        if (exists) {

            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });

        }

        const user = {

            id:
                "user_" +
                Date.now().toString(36),

            name:
                name,

            email:
                email,

            password:
                password,

            profileImage:
                "images/user.png",

            status:
                "Hey there! I am using FlyChat."
        };

        users.push(user);

        fs.writeFileSync(
            usersFile,
            JSON.stringify(
                users,
                null,
                2
            )
        );

        console.log(
            "New user registered:",
            {
                id: user.id,
                name: user.name,
                email: user.email,
                passwordLength: user.password.length
            }
        );

        return res.json({

            success: true,

            user: {

                id:
                    user.id,

                name:
                    user.name,

                email:
                    user.email,

                profileImage:
                    user.profileImage,

                status:
                    user.status
            }

        });

    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Could not register user."
        });

    }

});

app.post("/api/auth/login", (req, res) => {

    console.log("===== LOGIN REQUEST =====");

    try {

        const email =
            String(req.body?.email || "")
                .trim()
                .toLowerCase();

        const password =
            String(req.body?.password || "");

        console.log("Email:", email);
        console.log(
            "Password length:",
            password.length
        );

        // =========================
        // VALIDATION
        // =========================

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }

        // =========================
        // LOAD USERS
        // =========================

        const users =
            loadUsersData();

        // =========================
        // FIND USER
        // =========================

        const user =
            users.find(function (u) {

                return (
                    u.email &&
                    String(u.email)
                        .trim()
                        .toLowerCase() === email &&
                    String(u.password || "") === password
                );

            });

        // =========================
        // INVALID LOGIN
        // =========================

        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid Email or Password."
            });

        }

        // =========================
        // PUBLIC USER
        // DO NOT SEND PASSWORD
        // =========================

        const publicUser = {

            id:
                user.id,

            name:
                user.name,

            email:
                user.email,

            profileImage:
                user.profileImage ||
                "images/user.png",

            status:
                user.status ||
                "Hey there! I am using FlyChat."

        };

        console.log(
            "Login successful:",
            {
                id: user.id,
                name: user.name,
                email: user.email
            }
        );

        // =========================
        // LOGIN RESPONSE
        // =========================

        return res.json({

            success: true,

            user:
                publicUser

        });

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Server login error."

        });

    }

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

app.get("/api/privacy/:userId", (req, res) => {
    try{
        const userId = String(req.params.userId || "").trim();
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required."
            });
        }
        const privacyData = loadPrivacyData();
        const privacy = privacyData[userId] || {
            visibility: "everyone",
            selectedUsers: []
        };
        return res.json({
            success: true,
            privacy: privacy
        });
    } catch (error) {
        console.error("Load privacy error:", error);
        return res.status(500).json({
            success:false,
            message: " Could not load privacy settings."
        });
    }
});

app.post("/api/privacy/:userId", (req, res) => {
    try{
        const userId = String(req.params.userId || "").trim();
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required."
            });
        }
        const {
            visibility,
            selectedUsers
        } = req.body;
        const allowedVisibility = [
            "everyone",
            "contacts",
            "selected"
        ];
        if (!allowedVisibility.includes(visibility)) {
            return res.status(400).json({
                success: false,
                message: "Invalid privacy option."
            });
        }

        const users = Array.isArray(selectedUsers) ? selectedUsers.map(id => String(id)): [];
        if (visibility === "selected" && users.length === 0) {
            return res.status(400),json({
                success: false,
                message: "Please selected at least one account."
            });
        }
        const privacyData = loadPrivacyData();
        privacyData[userId] = {
            visibility: visibility,
            selectedUsers: users
        };
        savePrivacyData(privacyData);
        console.log("Privacy settings updated:", userId, privacyData[userId]);
        return res.json({
            success: true,
            message: "Privacy settings saved.",
            privacy: privacyData[userId]
        });
    } catch (error){
        console.error("Save privacy error:", error);
        return res.status(500).json({
            success: false,
            message: "Could not save privacy settings."
        });
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html"));
});

const PORT = 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`FlyChat Server running on http://localhost:${PORT}`);
    console.log(`FlyChat Server available on your network at port ${PORT}`);
});