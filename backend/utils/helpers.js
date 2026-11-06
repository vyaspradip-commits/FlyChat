const { v4: uuidv4 } = require("uuid");

const generateId = () => uuidv4();

const generateUsername = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "");
};

const formatDate = (date = new Date()) => {
    return new Date(date).toISOString();
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

const paginate = (items, page = 1, limit = 10) => {
    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.max(1, Number(limit) || 10);
    const startIndex = (currentPage - 1) * pageLimit;

    return {
        data: items.slice(startIndex, startIndex + pageLimit),
        currentPage,
        totalItems: items.length,
        totalPages: Math.ceil(items.length / pageLimit)
    };
};

const removeUndefined = (object) => {
    return Object.fromEntries(
        Object.entries(object).filter(([, value]) => value !== undefined)
    );
};

const capitalizeFirstLetter = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
};

module.exports = {
    generateId,
    generateUsername,
    formatDate,
    formatFileSize,
    isValidEmail,
    truncateText,
    paginate,
    removeUndefined,
    capitalizeFirstLetter
};