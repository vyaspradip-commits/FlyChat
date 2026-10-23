const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

require("dotenv").config();
const crypto = require("crypto");
const { Resend } = require("resend");
const { type } = require("os");
const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const pendingOtps = new Map();

const chatDataFile = path.join(__dirname, "chat-data.json");

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

app.listen(PORT, () => {
    console.log(`FlyChat Server running on http://localhost:${PORT}`);
});