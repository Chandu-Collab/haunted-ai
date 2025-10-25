import { Router } from 'express';
import { getChatHistory, sendMessage } from '../controllers/chatController.js';

const router = Router();

// Get chat history for a session
router.get('/history/:sessionId', getChatHistory);

// Send a new message
router.post('/send', sendMessage);

export default router;
