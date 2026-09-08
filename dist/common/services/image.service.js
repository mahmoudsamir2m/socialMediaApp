"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageService = void 0;
const applications_exceptions_1 = require("../exceptions/applications.exceptions");
const cloudinary_service_1 = require("./cloudinary.service");
class ImageService {
    async uploadProfileImage(file, userEmail) {
        return cloudinary_service_1.cloudinaryService.uploadFile(file, {
            folder: `users/${userEmail}/profile`,
            public_id: `profile-${Date.now()}`,
        });
    }
    async uploadImages({ userId, files, }) {
        if (!files || files.length === 0) {
            throw new applications_exceptions_1.BadRequestException("At least one image is required");
        }
        return Promise.all(files.map((file) => cloudinary_service_1.cloudinaryService.uploadFile(file, {
            folder: `${userId}/images`,
        })));
    }
    async deleteImage(publicId, resourceType = "image") {
        return cloudinary_service_1.cloudinaryService.deleteResource(publicId, resourceType);
    }
    async deleteImages(publicIds, resourceType = "image") {
        const ids = [...new Set(publicIds.filter(Boolean))];
        await Promise.all(ids.map((publicId) => this.deleteImage(publicId, resourceType)));
    }
    async replaceImage(file, oldPublicId) {
        return cloudinary_service_1.cloudinaryService.replaceFile(file, oldPublicId);
    }
}
exports.imageService = new ImageService();
exports.default = exports.imageService;
