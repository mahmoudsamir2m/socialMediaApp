import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.service";
import { BadRequestException } from "../exceptions/applications.exceptions";

export type CloudinaryUploadOptions = {
  folder?: string;
  public_id?: string;
  resource_type?: "image" | "video" | "raw";
  tags?: string[];
  transformation?: Record<string, unknown>[];
};

export type CloudinaryUploadedFile = {
  publicId: string;
  url: string;
  secureUrl: string;
  format?: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes?: number;
  folder?: string;
};

class CloudinaryService {
  constructor() {
    if (!env.CLOUDINARY_URL) {
      throw new BadRequestException(
        "Cloudinary environment variables are missing",
      );
    }

    cloudinary.config();
  }

  async uploadBuffer(
    fileBuffer: Buffer,
    options: CloudinaryUploadOptions = {},
  ) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException("Image buffer is empty");
    }

    return new Promise<any>((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder: options.folder ?? "social-media-app",
        resource_type: options.resource_type ?? "image",
        tags: options.tags ?? [],
        transformation: options.transformation ?? [],
      };

      if (options.public_id) {
        uploadOptions.public_id = options.public_id;
      }

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            reject(
              new BadRequestException("Failed to upload image to Cloudinary"),
            );
            return;
          }

          resolve(result);
        },
      );

      stream.end(fileBuffer);
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    options: CloudinaryUploadOptions = {},
  ): Promise<CloudinaryUploadedFile> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException("No valid file was provided");
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

  async deleteResource(publicId: string, resourceType: string = "image") {
    if (!publicId) {
      return { result: "not_found" };
    }

    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }

  async replaceFile(
    file: Express.Multer.File,
    oldPublicId?: string,
    options: CloudinaryUploadOptions = {},
  ) {
    if (oldPublicId) {
      await this.deleteResource(oldPublicId, options.resource_type ?? "image");
    }

    return this.uploadFile(file, options);
  }
}

export const cloudinaryService = new CloudinaryService();
