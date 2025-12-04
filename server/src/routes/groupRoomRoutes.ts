import { Router } from 'express';
import {
  getGroupRooms,
  createGroupRoom,
  joinGroupRoom,
  leaveGroupRoom,
  getRoomMessages,
  sendGroupMessage,
  updateRoomSettings,
  joinByInviteCode
} from '../controllers/groupRoomController';

const router = Router();

// Get all accessible group rooms
router.get('/', getGroupRooms);

// Create a new group room
router.post('/create-group', createGroupRoom);

// Join a room by ID
router.post('/join-group', joinGroupRoom);

// Leave a room
router.post('/leave-group', leaveGroupRoom);

// Join by invite code
router.post('/join-by-code', joinByInviteCode);

// Get messages for a specific room
router.get('/:roomId/messages', getRoomMessages);

// Send a message to a room
router.post('/:roomId/message', sendGroupMessage);

// Update room settings (moderators only)
router.put('/:roomId/settings', updateRoomSettings);

export default router;