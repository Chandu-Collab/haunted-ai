
import { Router } from 'express';
import { 
  searchMessages,
  getChatHistory, 
  sendMessage, 
  startStory, 
  makeStoryChoice, 
  getAvailableStories,
  analyzeImage,
  getMemoryContext,
  getCurrentWeather,
  getPersonalities,
  exportChatLog
} from '../controllers/chatController';





const router = Router();

import { getAIGreeting } from '../controllers/greetingController';
// AI-generated spooky greeting
router.get('/greeting', getAIGreeting);


// Search messages by keyword, room, or session
router.get('/search', searchMessages);

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

// Get available ghost personalities
router.get('/personalities', getPersonalities);

// Export chat log as a spooky story
router.get('/export', exportChatLog);


export default router;
