const { db } = require("./firebase");
async function connectDatabase() {
    await db.collection("_healthcheck").limit(1).get();
    console.log("Firebase Firestore connected successfully");
    return db;
}
module.exports = { db, connectDatabase };
