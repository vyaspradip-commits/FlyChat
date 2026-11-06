/**
 * ==========================================================
 * File: User.js
 * Project: FlyChat Backend
 * Description: User Model
 * Developer: Vaidik & Team
 * ==========================================================
 */

class User {

    constructor(data = {}) {

        this.uid = data.uid || "";

        this.name = data.name || "";

        this.email = data.email || "";

        this.phone = data.phone || "";

        this.profileImage = data.profileImage || "";

        this.bio = data.bio || "";

        this.gender = data.gender || "";

        this.dateOfBirth = data.dateOfBirth || "";

        this.status = data.status || "offline";

        this.lastSeen = data.lastSeen || new Date().toISOString();

        this.isEmailVerified = data.isEmailVerified || false;

        this.isBlocked = data.isBlocked || false;

        this.fcmToken = data.fcmToken || "";

        this.createdAt = data.createdAt || new Date().toISOString();

        this.updatedAt = data.updatedAt || new Date().toISOString();

    }

    /**
     * Convert Object to Firestore JSON
     */
    toJSON() {

        return {

            uid: this.uid,

            name: this.name,

            email: this.email,

            phone: this.phone,

            profileImage: this.profileImage,

            bio: this.bio,

            gender: this.gender,

            dateOfBirth: this.dateOfBirth,

            status: this.status,

            lastSeen: this.lastSeen,

            isEmailVerified: this.isEmailVerified,

            isBlocked: this.isBlocked,

            fcmToken: this.fcmToken,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt

        };

    }

    /**
     * Create User from Firestore Document
     */
    static fromFirestore(doc) {

        if (!doc.exists) return null;

        return new User(doc.data());

    }

}

module.exports = User;