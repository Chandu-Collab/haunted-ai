
import { Router } from 'express';
import { 
  searchMessages,
  getChatHistory, 
  sendMessage, 
  startStory, 
  makeStoryChoice, 
  getAvailableStories,
  generateCustomStory,
  continueStory,
  analyzeImage,
  getMemoryContext,
  getCurrentWeather,
  getSpiritualAtmosphere,
  getPersonalities,
  exportChatLog
} from '../controllers/chatController';
import { handleAIModeration, handleGroupMessage } from '../controllers/aiModerationController';





const router = Router();

import { getAIGreeting } from '../controllers/greetingController';
// AI-generated spooky greeting
router.get('/greeting', getAIGreeting);


// Search messages by keyword, room, or session
router.get('/search', searchMessages);

// Get current weather for atmospheric context
router.get('/weather', getCurrentWeather);

// Get user's geolocation-based spiritual atmosphere
router.post('/spiritual-atmosphere', getSpiritualAtmosphere);

// Get chat history for a session
router.get('/history/:sessionId', getChatHistory);

// Send a new message
router.post('/send', sendMessage);

// Story-related routes
router.get('/stories', getAvailableStories);
router.post('/story/start', startStory);
router.post('/story/choice', makeStoryChoice);
router.post('/story/generate', generateCustomStory);
router.post('/story/continue', continueStory);

// AI analysis routes
router.post('/analyze-image', analyzeImage);
router.get('/memory/:sessionId', getMemoryContext);
router.get('/weather', getCurrentWeather);

// Get available ghost personalities
router.get('/personalities', getPersonalities);

// Export chat log as a spooky story
router.get('/export', exportChatLog);

// Group chat and AI moderation routes
router.post('/ai-moderation', handleAIModeration);
router.post('/group-message', handleGroupMessage);

export default router;
