import multer from "multer";
import { BadRequestException } from "../common/exceptions/applications.exceptions";

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new BadRequestException("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const uploadedFiles = (
  req: Express.Request,
  field?: string,
): Express.Multer.File[] => {
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === "object") {
    if (field) return req.files[field] ?? [];
    return Object.values(req.files).flat();
  }
  if (req.file) return [req.file];
  return [];
};
