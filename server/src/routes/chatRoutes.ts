import { Router } from 'express';
import { getChatHistory, sendMessage } from '../controllers/chatController';

const router = Router();

// Get chat history for a session
router.get('/history/:sessionId', getChatHistory);

// Send a new message
router.post('/send', sendMessage);

export default router;
