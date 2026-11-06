/**
 * ==========================================================
 * File: Group.js
 * Project: FlyChat Backend
 * Description: Group Model
 * Developer: Vaidik & Team
 * ==========================================================
 */

const { v4: uuidv4 } = require("uuid");

class Group {

    constructor(data = {}) {

        this.groupId = data.groupId || uuidv4();

        this.groupName = data.groupName || "";

        this.groupDescription = data.groupDescription || "";

        this.groupImage = data.groupImage || "";

        this.createdBy = data.createdBy || "";

        this.admins = data.admins || [];

        this.members = data.members || [];

        this.totalMembers = data.totalMembers || 0;

        this.lastMessage = data.lastMessage || "";

        this.lastMessageBy = data.lastMessageBy || "";

        this.lastMessageTime = data.lastMessageTime || null;

        this.isPrivate = data.isPrivate || false;

        this.createdAt = data.createdAt || new Date();

        this.updatedAt = data.updatedAt || new Date();

    }

    /**
     * Convert object for Firestore
     */
    toJSON() {

        return {

            groupId: this.groupId,

            groupName: this.groupName,

            groupDescription: this.groupDescription,

            groupImage: this.groupImage,

            createdBy: this.createdBy,

            admins: this.admins,

            members: this.members,

            totalMembers: this.totalMembers,

            lastMessage: this.lastMessage,

            lastMessageBy: this.lastMessageBy,

            lastMessageTime: this.lastMessageTime,

            isPrivate: this.isPrivate,

            createdAt: this.createdAt,

            updatedAt: this.updatedAt

        };

    }

    /**
     * Add Member
     */
    addMember(userId) {

        if (!this.members.includes(userId)) {

            this.members.push(userId);

            this.totalMembers = this.members.length;

            this.updatedAt = new Date();

        }

    }

    /**
     * Remove Member
     */
    removeMember(userId) {

        this.members = this.members.filter(id => id !== userId);

        this.admins = this.admins.filter(id => id !== userId);

        this.totalMembers = this.members.length;

        this.updatedAt = new Date();

    }

    /**
     * Add Admin
     */
    addAdmin(userId) {

        if (!this.admins.includes(userId)) {

            this.admins.push(userId);

            this.updatedAt = new Date();

        }

    }

    /**
     * Remove Admin
     */
    removeAdmin(userId) {

        this.admins = this.admins.filter(id => id !== userId);

        this.updatedAt = new Date();

    }

    /**
     * Update Last Message
     */
    updateLastMessage(message, senderId) {

        this.lastMessage = message;

        this.lastMessageBy = senderId;

        this.lastMessageTime = new Date();

        this.updatedAt = new Date();

    }

}

module.exports = Group;