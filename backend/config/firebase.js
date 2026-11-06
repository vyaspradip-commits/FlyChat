const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const keyPath = path.join(__dirname, "..", "firebase-key.json");
if (!admin.apps.length) {
    if (fs.existsSync(keyPath)) {
        const serviceAccount = require(keyPath);
        const options = { credential: admin.credential.cert(serviceAccount) };
        if (process.env.FIREBASE_STORAGE_BUCKET) options.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
        admin.initializeApp(options);
    } else {
        admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || "flychat-local-dev" });
        console.warn("Firebase key not found. Server will start, but database endpoints require firebase-key.json or valid Application Default Credentials.");
    }
}
const db = admin.firestore();
const auth = admin.auth();
const storage = process.env.FIREBASE_STORAGE_BUCKET ? admin.storage() : null;
module.exports = { admin, db, auth, storage };
