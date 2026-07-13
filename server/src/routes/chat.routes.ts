import { Router } from 'express';
import { getChannels, createChannel, getMessages, sendMessage } from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/channels', getChannels);
router.post('/channels', createChannel);
router.get('/channels/:channelId/messages', getMessages);
router.post('/channels/:channelId/messages', sendMessage);

export default router;
