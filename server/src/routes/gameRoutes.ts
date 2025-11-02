import { Router } from 'express';
import { generateRiddle, getFortune } from '../controllers/gameController';

const router = Router();


// POST /api/games/riddle - generate a riddle using Gemini
router.post('/riddle', generateRiddle);

// GET /api/games/fortune - generate a fortune using Gemini
router.get('/fortune', getFortune);

export default router;
