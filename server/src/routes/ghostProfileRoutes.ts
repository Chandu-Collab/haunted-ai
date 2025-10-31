import { Router } from 'express';
import { getGhostProfiles, createGhostProfile, updateGhostAppearance } from '../controllers/ghostProfileController';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();


router.get('/', cacheMiddleware, getGhostProfiles);
router.post('/', createGhostProfile);
router.post('/appearance', updateGhostAppearance);

export default router;
