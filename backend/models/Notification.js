/**
 * ==========================================================
 * File: Notification.js
 * Project: FlyChat Backend
 * Description: Notification Model
 * Database: Firebase Firestore
 * Developer: Vaidik & Team
 * ==========================================================
 */

const { v4: uuidv4 } = require("uuid");

class Notification {

    constructor(data = {}) {

        this.notificationId = data.notificationId || uuidv4();

        this.userId = data.userId || "";

        this.senderId = data.senderId || "";

        this.title = data.title || "";

        this.message = data.message || "";

        this.type = data.type || "general";
        // general
        // chat
        // group
        // ai
        // system

        this.isRead = data.isRead || false;

        this.image = data.image || "";

        this.actionUrl = data.actionUrl || "";

        this.createdAt = data.createdAt || new Date().toISOString();

        this.updatedAt = data.updatedAt || new Date().toISOString();

    }

    /**
     * Convert Object for Firestore
     */

    toFirestore() {

        return {

            notificationId: this.notificationId,

            userId: this.userId,

            senderId: this.senderId,

            title: this.title,

            message: this.message,

            type: this.type,

            isRead: this.isRead,

            image: this.image,

            actionUrl: this.actionUrl,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt

        };

    }

    /**
     * Create Notification Object
     */

    static fromFirestore(doc) {

        if (!doc.exists) return null;

        return new Notification(doc.data());

    }

}

module.exports = Notification;