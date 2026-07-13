import { Router } from 'express';
import { chatWithAI } from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Protect AI route
router.use(requireAuth);

router.post('/chat', chatWithAI);

export default router;
