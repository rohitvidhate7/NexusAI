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
  res.status(200).json({ url: req.file.path });
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

    const doc = await Document.create({
      name: req.file.originalname,
      type,
      size: sizeInMB,
      url: req.file.path,
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

export default router;
