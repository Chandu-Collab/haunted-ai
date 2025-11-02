import { Router } from 'express';
import { generateRiddle, getFortune } from '../controllers/gameController';
import { castSpellAI } from '../controllers/spellController';
import { getRoomDescription } from '../controllers/roomController';

const router = Router();
// POST /api/games/spell - generate a spell result using Gemini
router.post('/spell', castSpellAI);

// POST /api/games/room-description - generate a haunted room description using Gemini
router.post('/room-description', getRoomDescription);


// POST /api/games/riddle - generate a riddle using Gemini
router.post('/riddle', generateRiddle);

// GET /api/games/fortune - generate a fortune using Gemini
router.get('/fortune', getFortune);

export default router;
