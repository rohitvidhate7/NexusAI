"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cloudinary_service_1 = require("../services/cloudinary.service");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth);
router.post('/avatar', cloudinary_service_1.upload.single('avatar'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(200).json({ url: req.file.path });
});
router.post('/document', cloudinary_service_1.upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(200).json({
        url: req.file.path,
        size: req.file.size,
        filename: req.file.filename
    });
});
exports.default = router;
