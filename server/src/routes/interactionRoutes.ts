import { Router } from 'express';
import { getInteraction, upsertInteraction, patchInteraction } from '../controllers/interactionController';
import authenticateJWT from '../middleware/auth';

const router = Router();

// Fetch interaction state for a session (read allowed but enforces ownership if record claimed)
router.get('/:sessionId', getInteraction);

// Upsert entire interaction state (requires authentication)
router.post('/:sessionId', authenticateJWT, upsertInteraction);

// Patch small updates (addAchievements, addRooms, energy) (requires authentication)
router.patch('/:sessionId', authenticateJWT, patchInteraction);

export default router;
