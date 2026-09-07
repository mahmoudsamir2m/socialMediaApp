import { BadRequestException } from "../exceptions/applications.exceptions";
import { cloudinaryService } from "./cloudinary.service";

class ImageService {
  async uploadProfileImage(file: Express.Multer.File, userEmail: string) {
    return cloudinaryService.uploadFile(file, {
      folder: `users/${userEmail}/profile`,
      public_id: `profile-${Date.now()}`,
    });
  }

  async uploadImages({
    userId,
    files,
  }: {
    userId: string;
    files: Express.Multer.File[];
  }) {
    if (!files || files.length === 0) {
      throw new BadRequestException("At least one image is required");
    }

    return Promise.all(
      files.map((file) =>
        cloudinaryService.uploadFile(file, {
          folder: `${userId}/images`,
        }),
      ),
    );
  }

  async deleteImage(publicId: string, resourceType = "image") {
    return cloudinaryService.deleteResource(publicId, resourceType);
  }

  async deleteImages(publicIds: string[], resourceType = "image") {
    const ids = [...new Set(publicIds.filter(Boolean))];
    await Promise.all(ids.map((publicId) => this.deleteImage(publicId, resourceType)));
  }

  async replaceImage(file: Express.Multer.File, oldPublicId?: string) {
    return cloudinaryService.replaceFile(file, oldPublicId);
  }
}

export const imageService = new ImageService();
export default imageService;
