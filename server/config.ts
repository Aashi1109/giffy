import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const config = {
  host: process.env.HOST || "localhost",
  port: +process.env.PORT,
  openaiKey: process.env.OPENAI_API_KEY || "",
  uploadFolders: path.join(__dirname, process.env.UPLOAD_FOLDER || "uploads"),
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: +(process.env.REDIS_PORT || 6379),
  },
  logDir: process.env.LOG_DIR || "./logs",
  logLevel: process.env.LOG_LEVEL || "INFO",
  jsonDBUrl: process.env.JSON_DB_URL,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
    folderPath: "GiffyAPI",
  },
  retryExponentialMultipler: 1000,
  maxRetry: 3,
};

export default config;
