"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuccessResponse = void 0;
const SuccessResponse = ({ res, message = "Success", status = 200, data = {}, }) => {
    return res.status(status).json({
        message,
        data,
    });
};
exports.SuccessResponse = SuccessResponse;
