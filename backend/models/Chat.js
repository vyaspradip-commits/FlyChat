/**
 * ==========================================================
 * File: Chat.js
 * Project: FlyChat Backend
 * Description: Chat Model
 * Developer: Vaidik & Team
 * ==========================================================
 */

const { v4: uuidv4 } = require("uuid");

class Chat {

    constructor(data = {}) {

        this.chatId = data.chatId || uuidv4();

        this.senderId = data.senderId || "";

        this.receiverId = data.receiverId || "";

        this.message = data.message || "";

        this.messageType = data.messageType || "text";
        // text, image, file, audio, video

        this.fileUrl = data.fileUrl || "";

        this.fileName = data.fileName || "";

        this.fileSize = data.fileSize || 0;

        this.replyTo = data.replyTo || "";

        this.isEdited = data.isEdited || false;

        this.isDeleted = data.isDeleted || false;

        this.isSeen = data.isSeen || false;

        this.reactions = data.reactions || [];

        this.createdAt = data.createdAt || new Date();

        this.updatedAt = data.updatedAt || new Date();

    }

    /**
     * Convert Object to Firestore JSON
     */
    toJSON() {

        return {

            chatId: this.chatId,

            senderId: this.senderId,

            receiverId: this.receiverId,

            message: this.message,

            messageType: this.messageType,

            fileUrl: this.fileUrl,

            fileName: this.fileName,

            fileSize: this.fileSize,

            replyTo: this.replyTo,

            isEdited: this.isEdited,

            isDeleted: this.isDeleted,

            isSeen: this.isSeen,

            reactions: this.reactions,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt

        };

    }

    /**
     * Mark Message as Seen
     */
    markAsSeen() {

        this.isSeen = true;

        this.updatedAt = new Date();

    }

    /**
     * Edit Message
     */
    editMessage(newMessage) {

        this.message = newMessage;

        this.isEdited = true;

        this.updatedAt = new Date();

    }

    /**
     * Delete Message
     */
    deleteMessage() {

        this.isDeleted = true;

        this.updatedAt = new Date();

    }

    /**
     * Add Emoji Reaction
     */
    addReaction(userId, emoji) {

        this.reactions.push({

            userId,

            emoji,

            reactedAt: new Date()

        });

        this.updatedAt = new Date();

    }

}

module.exports = Chat;