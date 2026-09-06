"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const globalErrorHandler = (err, req, res, next) => {
    return res.status(err.status || 500).json({
        message: err.message,
        status: err.status,
        cause: err.cause,
    });
};
exports.globalErrorHandler = globalErrorHandler;
