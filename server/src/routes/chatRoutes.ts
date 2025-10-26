import { Router } from 'express';
import { 
  getChatHistory, 
  sendMessage, 
  startStory, 
  makeStoryChoice, 
  getAvailableStories,
  analyzeImage,
  getMemoryContext,
  getCurrentWeather
} from '../controllers/chatController';

const router = Router();

// Get chat history for a session
router.get('/history/:sessionId', getChatHistory);

// Send a new message
router.post('/send', sendMessage);

// Story-related routes
router.get('/stories', getAvailableStories);
router.post('/story/start', startStory);
router.post('/story/choice', makeStoryChoice);

// AI analysis routes
router.post('/analyze-image', analyzeImage);
router.get('/memory/:sessionId', getMemoryContext);
router.get('/weather', getCurrentWeather);

export default router;
