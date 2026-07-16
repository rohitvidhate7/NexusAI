"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cloudinary_service_js_1 = require("../services/cloudinary.service.js");
const auth_js_1 = require("../middleware/auth.js");
const Document_js_1 = __importDefault(require("../models/Document.js"));
const router = (0, express_1.Router)();
router.use(auth_js_1.requireAuth);
router.post('/avatar', cloudinary_service_js_1.upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    let fileUrl = req.file.path;
    const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_CLOUD_NAME !== 'Root' &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;
    if (!isCloudinaryConfigured) {
        const host = req.get('host');
        const protocol = req.protocol;
        fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }
    res.status(200).json({ url: fileUrl });
});
router.post('/document', cloudinary_service_js_1.upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { workspaceId } = req.body;
        if (!workspaceId) {
            return res.status(400).json({ message: 'workspaceId is required' });
        }
        const type = req.file.originalname.split('.').pop() || 'file';
        const sizeInMB = (req.file.size / (1024 * 1024)).toFixed(2) + ' MB';
        let fileUrl = req.file.path;
        const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_CLOUD_NAME !== 'Root' &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET;
        if (!isCloudinaryConfigured) {
            const host = req.get('host');
            const protocol = req.protocol;
            fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
        }
        const doc = await Document_js_1.default.create({
            name: req.file.originalname,
            type,
            size: sizeInMB,
            url: fileUrl,
            uploadedBy: req.user.id,
            workspaceId
        });
        const populated = await doc.populate('uploadedBy', 'name initials color email');
        res.status(200).json(populated);
    }
    catch (error) {
        console.error('Error saving document:', error);
        res.status(500).json({ message: 'Server error saving document' });
    }
});
router.get('/documents', async (req, res) => {
    try {
        const { workspaceId } = req.query;
        if (!workspaceId) {
            return res.status(400).json({ message: 'workspaceId is required' });
        }
        const docs = await Document_js_1.default.find({ workspaceId: workspaceId })
            .populate('uploadedBy', 'name initials color email');
        res.status(200).json(docs);
    }
    catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Server error fetching documents' });
    }
});
exports.default = router;
