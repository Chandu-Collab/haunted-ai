import { Router } from 'express';
import { 
  getRooms, 
  createRoom, 
  joinRoom, 
  leaveRoom, 
  updateRoomDecorations,
  joinRoomByInvite,
  updateConversationMetrics,
  getAIModerationSuggestion
} from '../controllers/roomController';

const router = Router();

router.get('/', getRooms);
router.post('/', createRoom);
router.post('/join', joinRoom);
router.post('/join-invite', joinRoomByInvite);
router.post('/leave', leaveRoom);
router.post('/decorate', updateRoomDecorations);
router.post('/metrics', updateConversationMetrics);
router.get('/ai-suggestion/:roomId', getAIModerationSuggestion);

export default router;
