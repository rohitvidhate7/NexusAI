import { Router } from 'express';
import { upload } from '../services/cloudinary.service.js';
import { requireAuth } from '../middleware/auth.js';
import Document from '../models/Document.js';

const router = Router();

router.use(requireAuth);

router.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  let fileUrl = req.file.path;
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
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

router.post('/document', upload.single('document'), async (req, res) => {
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
    const isCloudinaryConfigured = 
      process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_CLOUD_NAME !== 'Root' &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;
    if (!isCloudinaryConfigured) {
      const host = req.get('host');
      const protocol = req.protocol;
      fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    }

    const doc = await Document.create({
      name: req.file.originalname,
      type,
      size: sizeInMB,
      url: fileUrl,
      uploadedBy: (req as any).user.id,
      workspaceId
    });

    const populated = await doc.populate('uploadedBy', 'name initials color email');

    res.status(200).json(populated);
  } catch (error) {
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
    const docs = await Document.find({ workspaceId: workspaceId as string })
      .populate('uploadedBy', 'name initials color email');
    res.status(200).json(docs);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
});

router.delete('/document/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const isCloudinary = doc.url.includes('cloudinary.com');
    if (isCloudinary) {
      const parts = doc.url.split('/');
      const filename = parts.pop() || '';
      const publicId = filename.split('.')[0];
      const folderName = 'nexusai_uploads';
      const fullPublicId = `${folderName}/${publicId}`;
      try {
        const { deleteFile } = await import('../services/cloudinary.service.js');
        await deleteFile(fullPublicId);
      } catch (err) {
        console.error('Failed to delete file from Cloudinary:', err);
      }
    } else {
      const filename = doc.url.split('/').pop() || '';
      try {
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(process.cwd(), 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Failed to delete local file:', err);
      }
    }

    await Document.findByIdAndDelete(id);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error deleting document' });
  }
});

export default router;
