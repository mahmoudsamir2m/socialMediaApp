"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageCompositionService = void 0;
const sharp_1 = __importDefault(require("sharp"));
const applications_exceptions_1 = require("../exceptions/applications.exceptions");
class ImageCompositionService {
    async mergeImages({ images, logoBuffer, padding = 24, }) {
        if (!images || images.length === 0) {
            throw new applications_exceptions_1.BadRequestException("At least one image is required to merge");
        }
        const normalized = await Promise.all(images.map(async (image) => {
            const metadata = await (0, sharp_1.default)(image.buffer).metadata();
            return {
                ...image,
                width: image.width ?? metadata.width ?? 1000,
                height: image.height ?? metadata.height ?? 1000,
            };
        }));
        const maxWidth = Math.max(...normalized.map((image) => image.width));
        const maxHeight = Math.max(...normalized.map((image) => image.height));
        const columns = Math.min(2, normalized.length);
        const rows = Math.ceil(normalized.length / columns);
        const finalWidth = columns * maxWidth + (columns + 1) * padding;
        const finalHeight = rows * maxHeight + (rows + 1) * padding;
        const composites = await Promise.all(normalized.map(async (image, index) => {
            const column = index % columns;
            const row = Math.floor(index / columns);
            const left = padding + column * (maxWidth + padding);
            const top = padding + row * (maxHeight + padding);
            const resized = await (0, sharp_1.default)(image.buffer)
                .resize(maxWidth, maxHeight, {
                fit: "contain",
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            })
                .png()
                .toBuffer();
            return {
                input: resized,
                left,
                top,
            };
        }));
        let mergedBuffer = await (0, sharp_1.default)({
            create: {
                width: finalWidth,
                height: finalHeight,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
        })
            .composite(composites)
            .png()
            .toBuffer();
        if (logoBuffer) {
            const logoImage = await (0, sharp_1.default)(logoBuffer)
                .resize(Math.round(finalWidth * 0.22), Math.round(finalHeight * 0.22), {
                fit: "inside",
                withoutEnlargement: true,
            })
                .png()
                .toBuffer();
            const logoMetadata = await (0, sharp_1.default)(logoImage).metadata();
            const logoWidth = logoMetadata.width ?? Math.round(finalWidth * 0.22);
            const logoHeight = logoMetadata.height ?? Math.round(finalHeight * 0.22);
            mergedBuffer = await (0, sharp_1.default)(mergedBuffer)
                .composite([
                {
                    input: logoImage,
                    top: finalHeight - logoHeight - padding,
                    left: finalWidth - logoWidth - padding,
                },
            ])
                .png()
                .toBuffer();
        }
        return mergedBuffer;
    }
}
exports.imageCompositionService = new ImageCompositionService();
