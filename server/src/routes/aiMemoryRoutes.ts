import { Router } from 'express';
import {
  storeMemory,
  getMemories,
  analyzeMessage,
  updateRelationship,
  getAIContext,
  getRelationshipStatus,
  getSentimentTrend
} from '../controllers/aiMemoryController';
// Temporarily disable auth for testing
// import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Temporarily disable authentication middleware for testing
// router.use(authenticateJWT);

// Memory management routes
router.post('/memory', storeMemory);
router.get('/memory/:userId', getMemories);

// Sentiment analysis routes
router.post('/sentiment/analyze', analyzeMessage);
router.get('/sentiment/trend/:userId', getSentimentTrend);

// Relationship management routes
router.post('/relationship/update', updateRelationship);
router.get('/relationship/:userId/:ghostPersonalityId', getRelationshipStatus);

// AI context generation
router.post('/context', getAIContext);

export default router;