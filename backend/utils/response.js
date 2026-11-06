const successResponse = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

const errorResponse = (res, message, statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
        success: false,
        message,
        errors
    });
};

const paginatedResponse = (res, message, data, page, limit, total) => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse
};