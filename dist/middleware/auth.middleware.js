"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const token_service_1 = require("../common/services/token.service");
const applications_exceptions_1 = require("../common/exceptions/applications.exceptions");
const authMiddleware = (req, _res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        throw new applications_exceptions_1.UnauthorizedException("Access token is required");
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        throw new applications_exceptions_1.UnauthorizedException("Access token is required");
    }
    req.user = token_service_1.tokenService.verifyAccessToken(token);
    next();
};
exports.authMiddleware = authMiddleware;
