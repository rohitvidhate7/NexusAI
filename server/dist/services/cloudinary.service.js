"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'Root' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;
let storage;
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    storage = new multer_storage_cloudinary_1.CloudinaryStorage({
        cloudinary: cloudinary_1.v2,
        params: {
            folder: 'nexusai_uploads',
            resource_type: 'auto',
        },
    });
    console.log('☁️ Cloudinary storage configured.');
}
else {
    const uploadDir = path_1.default.join(process.cwd(), 'uploads');
    if (!fs_1.default.existsSync(uploadDir)) {
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
    }
    storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, uniqueSuffix + '-' + file.originalname);
        }
    });
    console.log('📁 Local disk storage fallback configured.');
}
exports.upload = (0, multer_1.default)({ storage: storage });
const deleteFile = async (publicId) => {
    if (isCloudinaryConfigured) {
        try {
            await cloudinary_1.v2.uploader.destroy(publicId);
        }
        catch (error) {
            console.error('Error deleting file from Cloudinary:', error);
            throw error;
        }
    }
    else {
        try {
            const filePath = path_1.default.join(process.cwd(), 'uploads', publicId);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                console.log(`Deleted local file: ${publicId}`);
            }
        }
        catch (error) {
            console.error('Error deleting local file:', error);
        }
    }
};
exports.deleteFile = deleteFile;
