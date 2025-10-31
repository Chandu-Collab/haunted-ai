import { Router } from 'express';
import { getRooms, createRoom, joinRoom, leaveRoom, updateRoomDecorations } from '../controllers/roomController';

const router = Router();

router.get('/', getRooms);
router.post('/', createRoom);
router.post('/join', joinRoom);
router.post('/leave', leaveRoom);
router.post('/decorate', updateRoomDecorations);

export default router;
