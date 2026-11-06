const morgan = require("morgan");

const logger = {
    info: (...args) => console.log("[INFO]", ...args),

    warn: (...args) => console.warn("[WARN]", ...args),

    error: (...args) => console.error("[ERROR]", ...args),

    debug: (...args) => {
        if (process.env.NODE_ENV !== "production") {
            console.debug("[DEBUG]", ...args);
        }
    }
};

const requestLogger = morgan("dev");

module.exports = {
    logger,
    requestLogger
};