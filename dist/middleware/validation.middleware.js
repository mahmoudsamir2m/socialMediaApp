"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validation = void 0;
const applications_exceptions_1 = require("../common/exceptions/applications.exceptions");
const validation = (schema) => {
    return (req, res, next) => {
        let validationErrors = [];
        for (const key of Object.keys(schema)) {
            if (!schema[key]) {
                continue;
            }
            const value = schema[key].safeParse(req[key]);
            if (!value.success) {
                validationErrors.push({
                    key,
                    issue: value.error.issues,
                });
            }
        }
        if (validationErrors.length > 0) {
            throw new applications_exceptions_1.BadRequestException("validation errors", validationErrors);
        }
        next();
    };
};
exports.validation = validation;
