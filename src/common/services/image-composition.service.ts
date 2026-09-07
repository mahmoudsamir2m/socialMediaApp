import sharp from "sharp";
import { BadRequestException } from "../exceptions/applications.exceptions";

export type ComposedImageInput = {
  buffer: Buffer;
  width?: number;
  height?: number;
};

class ImageCompositionService {
  async mergeImages({
    images,
    logoBuffer,
    padding = 24,
  }: {
    images: ComposedImageInput[];
    logoBuffer?: Buffer | null;
    padding?: number;
  }) {
    if (!images || images.length === 0) {
      throw new BadRequestException("At least one image is required to merge");
    }

    const normalized = await Promise.all(
      images.map(async (image) => {
        const metadata = await sharp(image.buffer).metadata();
        return {
          ...image,
          width: image.width ?? metadata.width ?? 1000,
          height: image.height ?? metadata.height ?? 1000,
        };
      }),
    );

    const maxWidth = Math.max(...normalized.map((image) => image.width));
    const maxHeight = Math.max(...normalized.map((image) => image.height));
    const columns = Math.min(2, normalized.length);
    const rows = Math.ceil(normalized.length / columns);
    const finalWidth = columns * maxWidth + (columns + 1) * padding;
    const finalHeight = rows * maxHeight + (rows + 1) * padding;

    const composites = await Promise.all(
      normalized.map(async (image, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const left = padding + column * (maxWidth + padding);
        const top = padding + row * (maxHeight + padding);

        const resized = await sharp(image.buffer)
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
      }),
    );

    let mergedBuffer = await sharp({
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
      const logoImage = await sharp(logoBuffer)
        .resize(Math.round(finalWidth * 0.22), Math.round(finalHeight * 0.22), {
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer();

      const logoMetadata = await sharp(logoImage).metadata();
      const logoWidth = logoMetadata.width ?? Math.round(finalWidth * 0.22);
      const logoHeight = logoMetadata.height ?? Math.round(finalHeight * 0.22);

      mergedBuffer = await sharp(mergedBuffer)
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

export const imageCompositionService = new ImageCompositionService();
