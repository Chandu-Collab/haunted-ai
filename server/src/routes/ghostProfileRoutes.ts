import { Router } from 'express';
import {
  getGhostProfiles,
  getGhostProfile,
  createGhostProfile,
  updateGhostProfile,
  deleteGhostProfile,
  updateGhostAppearance,
  updateGhostStats,
  cloneGhostProfile
} from '../controllers/ghostProfileController';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Get all ghost profiles with filtering
router.get('/', cacheMiddleware, getGhostProfiles);

// Get single ghost profile
router.get('/:id', getGhostProfile);

// Create new ghost profile
router.post('/', createGhostProfile);

// Update ghost profile
router.put('/:id', updateGhostProfile);

// Delete ghost profile
router.delete('/:id', deleteGhostProfile);

// Update appearance only
router.post('/appearance', updateGhostAppearance);

// Update usage statistics
router.post('/:id/stats', updateGhostStats);

// Clone ghost profile
router.post('/:id/clone', cloneGhostProfile);

export default router;
