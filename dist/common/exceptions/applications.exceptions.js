"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundException = exports.ForbiddenException = exports.ConflictException = exports.UnauthorizedException = exports.BadRequestException = exports.ApplicationException = void 0;
class ApplicationException extends Error {
    status;
    constructor(message, status, cause) {
        super(message, { cause });
        this.status = status;
        this.name = this.constructor.name;
    }
}
exports.ApplicationException = ApplicationException;
class BadRequestException extends ApplicationException {
    constructor(message, cause) {
        super(message, 400, { cause });
    }
}
exports.BadRequestException = BadRequestException;
class UnauthorizedException extends ApplicationException {
    constructor(message, cause) {
        super(message, 401, { cause });
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ConflictException extends ApplicationException {
    constructor(message, cause) {
        super(message, 409, { cause });
    }
}
exports.ConflictException = ConflictException;
class ForbiddenException extends ApplicationException {
    constructor(message, cause) {
        super(message, 403, { cause });
    }
}
exports.ForbiddenException = ForbiddenException;
class NotFoundException extends ApplicationException {
    constructor(message, cause) {
        super(message, 404, { cause });
    }
}
exports.NotFoundException = NotFoundException;
