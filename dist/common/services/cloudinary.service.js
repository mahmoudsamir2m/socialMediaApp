"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
const env_service_1 = require("../../config/env.service");
const applications_exceptions_1 = require("../exceptions/applications.exceptions");
class CloudinaryService {
    constructor() {
        if (!env_service_1.env.CLOUDINARY_URL) {
            throw new applications_exceptions_1.BadRequestException("Cloudinary environment variables are missing");
        }
        cloudinary_1.v2.config();
    }
    async uploadBuffer(fileBuffer, options = {}) {
        if (!fileBuffer || fileBuffer.length === 0) {
            throw new applications_exceptions_1.BadRequestException("Image buffer is empty");
        }
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                folder: options.folder ?? "social-media-app",
                resource_type: options.resource_type ?? "image",
                tags: options.tags ?? [],
                transformation: options.transformation ?? [],
            };
            if (options.public_id) {
                uploadOptions.public_id = options.public_id;
            }
            const stream = cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, result) => {
                if (error || !result) {
                    reject(new applications_exceptions_1.BadRequestException("Failed to upload image to Cloudinary"));
                    return;
                }
                resolve(result);
            });
            stream.end(fileBuffer);
        });
    }
    async uploadFile(file, options = {}) {
        if (!file || !file.buffer || file.buffer.length === 0) {
            throw new applications_exceptions_1.BadRequestException("No valid file was provided");
        }
        const result = await this.uploadBuffer(file.buffer, {
            ...options,
            resource_type: options.resource_type ?? "image",
            folder: options.folder ?? "social-media-app",
        });
        return {
            publicId: result.public_id,
            url: result.secure_url,
            secureUrl: result.secure_url,
            format: result.format,
            resourceType: result.resource_type,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            folder: result.folder,
        };
    }
    async deleteResource(publicId, resourceType = "image") {
        if (!publicId) {
            return { result: "not_found" };
        }
        return cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    }
    async replaceFile(file, oldPublicId, options = {}) {
        if (oldPublicId) {
            await this.deleteResource(oldPublicId, options.resource_type ?? "image");
        }
        return this.uploadFile(file, options);
    }
}
exports.cloudinaryService = new CloudinaryService();
