/**
 * ==========================================================
 * File: Message.js
 * Project: FlyChat Backend
 * Description: Message Model
 * Developer: Vaidik & Team
 * ==========================================================
 */

const { v4: uuidv4 } = require("uuid");

class Message {

    constructor(data = {}) {

        this.messageId = data.messageId || uuidv4();

        this.chatId = data.chatId || "";

        this.senderId = data.senderId || "";

        this.receiverId = data.receiverId || "";

        this.groupId = data.groupId || null;

        this.message = data.message || "";

        this.messageType = data.messageType || "text";
        // text | image | video | audio | file

        this.fileUrl = data.fileUrl || "";

        this.fileName = data.fileName || "";

        this.fileSize = data.fileSize || 0;

        this.replyTo = data.replyTo || null;

        this.reactions = data.reactions || [];

        this.isEdited = data.isEdited || false;

        this.isDeleted = data.isDeleted || false;

        this.isSeen = data.isSeen || false;

        this.seenAt = data.seenAt || null;

        this.createdAt = data.createdAt || new Date();

        this.updatedAt = data.updatedAt || new Date();
    }

    /**
     * Convert Model to Firestore Object
     */
    toJSON() {

        return {

            messageId: this.messageId,

            chatId: this.chatId,

            senderId: this.senderId,

            receiverId: this.receiverId,

            groupId: this.groupId,

            message: this.message,

            messageType: this.messageType,

            fileUrl: this.fileUrl,

            fileName: this.fileName,

            fileSize: this.fileSize,

            replyTo: this.replyTo,

            reactions: this.reactions,

            isEdited: this.isEdited,

            isDeleted: this.isDeleted,

            isSeen: this.isSeen,

            seenAt: this.seenAt,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt

        };

    }

}

module.exports = Message;