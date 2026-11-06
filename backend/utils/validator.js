
const validator = {
    isEmail: (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
    },

    isPassword: (password) => {
        return typeof password === "string" && password.length >= 6;
    },

    isRequired: (value) => {
        return value !== undefined && value !== null && String(value).trim() !== "";
    },

    isString: (value) => {
        return typeof value === "string" && value.trim().length > 0;
    },

    isNumber: (value) => {
        return value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));
    },

    isValidId: (id) => {
        return typeof id === "string" && id.trim().length > 0;
    },

    isValidPhone: (phone) => {
        return /^\+?[0-9]{10,15}$/.test(String(phone || "").trim());
    },

    isValidUsername: (username) => {
        return /^[a-zA-Z0-9_]{3,20}$/.test(String(username || "").trim());
    },

    isValidMessage: (message) => {
        return typeof message === "string" && message.trim().length > 0 && message.length <= 5000;
    },

    isValidUrl: (url) => {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
        } catch {
            return false;
        }
    },

    isValidArray: (value) => {
        return Array.isArray(value);
    },

    isValidObject: (value) => {
        return value !== null && typeof value === "object" && !Array.isArray(value);
    }
};

module.exports = validator;
