import { Router } from 'express';
import { getGhostProfiles, createGhostProfile } from '../controllers/ghostProfileController';

const router = Router();

router.get('/', getGhostProfiles);
router.post('/', createGhostProfile);

export default router;
