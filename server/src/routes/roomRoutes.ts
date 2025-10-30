import { Router } from 'express';
import { getRooms, createRoom, joinRoom, leaveRoom } from '../controllers/roomController';

const router = Router();

router.get('/', getRooms);
router.post('/', createRoom);
router.post('/join', joinRoom);
router.post('/leave', leaveRoom);

export default router;
