import { Router } from 'express';
import { getGhostProfiles, createGhostProfile, updateGhostAppearance } from '../controllers/ghostProfileController';

const router = Router();


router.get('/', getGhostProfiles);
router.post('/', createGhostProfile);
router.post('/appearance', updateGhostAppearance);

export default router;
