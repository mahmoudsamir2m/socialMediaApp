import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(`./.env.${process.env.NODE_ENV}`) });

const mongoURL = process.env.MONGO_URI as string;
const mongoURL_PROD = process.env.MONGO_URI_PROD as string;
const mood = process.env.MOOD as string;
const port = process.env.PORT as string;
const salt = process.env.SALT as string;
const jwt_key = process.env.JWT_KEY as string;
const userSignature = process.env.JWT_USER_SIGNATURE as string;
const adminSignature = process.env.JWT_ADMIN_SIGNATUER as string;
const userRefreshSignature = process.env.JWT_USER_REFRESH_SIGNATURE as string;
const adminRefreshSignature = process.env.JWT_ADMIN_REFRESH_SIGNATURE as string;
const BASE_URL = process.env.BASE_URL as string;
const REDIS_URI = process.env.REDIS_URI as string;
const APP_PASSWORD = process.env.APP_PASSWORD as string;
const APP_EMAIL = process.env.APP_EMAIL as string;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL as string;

export const env = {
  port,
  mongoURL,
  mongoURL_PROD,
  mood,
  salt,
  jwt_key,
  userSignature,
  adminSignature,
  userRefreshSignature,
  adminRefreshSignature,
  BASE_URL,
  REDIS_URI,
  APP_PASSWORD,
  APP_EMAIL,
  CLOUDINARY_URL,
};
