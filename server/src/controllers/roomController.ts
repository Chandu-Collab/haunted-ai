// AI-powered haunted room description
import { getAIProvider } from '../ai/providerFactory';

// POST /api/games/room-description - AI-generated haunted room description
export const getRoomDescription = async (req: Request, res: Response) => {
  try {
    const { room } = req.body;
    if (!room || typeof room !== 'string' || !room.trim()) {
      return res.status(400).json({ description: 'The spirits are confused. Try a real room!' });
    }
    const ai = getAIProvider('gemini');
    const prompt = `You are a ghostly tour guide in a haunted mansion. The user enters the room: "${room}". Describe the room in a short, vivid, spooky, and immersive way. Mention ghostly presences, mysterious objects, or supernatural events. Never repeat the same description. Do not include explanations or extra text, just the description.`;
    const description = await ai.generateResponse(prompt);
    res.json({ description: description.trim() });
  } catch (e) {
    const errorMessages = [
      'The mists grow too thick to see clearly...',
      'An otherworldly force blocks your vision...',
      'The ethereal realm refuses to reveal its secrets...',
      'Ancient magic obscures the path ahead...',
      'The veil between worlds grows too dense...',
      'Spectral interference clouds your sight...',
      'The ghostly realm withdraws into shadow...'
    ];
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    res.status(500).json({ description: randomError });
  }
};
// Update room decorations
export const updateRoomDecorations = async (req: Request, res: Response) => {
  try {
    const { roomId, decorations } = req.body;
    if (!roomId || !decorations) return res.status(400).json({ error: 'roomId and decorations required' });
    const roomRepo = AppDataSource.getRepository(Room);
    const room = await roomRepo.findOneBy({ id: roomId });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    room.decorations = decorations;
    await roomRepo.save(room);
    res.json({ success: true, decorations });
  } catch (err) {
    console.error('updateRoomDecorations error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Room } from '../entities/Room';
import { User } from '../entities/User';

export const getRooms = async (req: Request, res: Response) => {
  const { type, privacy } = req.query;
  const roomRepo = AppDataSource.getRepository(Room);
  
  let whereClause: any = {};
  if (type) whereClause.type = type;
  if (privacy) whereClause.privacy = privacy;
  
  // Only show public rooms and rooms user has access to
  if (!privacy) {
    whereClause.privacy = 'public';
  }
  
  const rooms = await roomRepo.find({ 
    where: whereClause,
    relations: ['users'],
    order: { updatedAt: 'DESC' }
  });
  
  // Filter out sensitive data for public listing
  const publicRooms = rooms.map(room => ({
    id: room.id,
    name: room.name,
    type: room.type,
    description: room.description,
    privacy: room.privacy,
    maxParticipants: room.maxParticipants,
    participantCount: room.users?.length || 0,
    chatMode: room.chatMode,
    theme: room.theme,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  }));
  
  res.json(publicRooms);
};

export const createRoom = async (req: Request, res: Response) => {
  const { 
    name, 
    type = 'haunted',
    description,
    privacy = 'public',
    maxParticipants = 10,
    chatMode,
    aiModerationEnabled = true,
    aiInterventionDelay = 30,
    aiSettings,
    theme
  } = req.body;
  
  const roomRepo = AppDataSource.getRepository(Room);
  const existing = await roomRepo.findOneBy({ name });
  if (existing) return res.status(400).json({ error: 'Room already exists' });
  
  // Generate invite code for private/invite-only rooms
  let inviteCode;
  if (privacy === 'invite_only' || privacy === 'private') {
    inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  
  const room = roomRepo.create({ 
    name,
    type,
    description,
    privacy,
    inviteCode,
    maxParticipants,
    chatMode,
    aiModerationEnabled,
    aiInterventionDelay,
    aiSettings,
    theme,
    conversationMetrics: {
      totalMessages: 0,
      activeUsers: 0,
      avgResponseTime: 0,
      lastActivity: new Date(),
      engagementLevel: 0
    }
  });
  
  await roomRepo.save(room);
  res.status(201).json(room);
};

export const joinRoom = async (req: Request, res: Response) => {
  const { roomId, userId } = req.body;
  const roomRepo = AppDataSource.getRepository(Room);
  const userRepo = AppDataSource.getRepository(User);
  const room = await roomRepo.findOne({ where: { id: roomId }, relations: ['users'] });
  const user = await userRepo.findOneBy({ id: userId });
  if (!room || !user) return res.status(404).json({ error: 'Room or user not found' });
  if (!room.users.find(u => u.id === userId)) {
    room.users.push(user);
    await roomRepo.save(room);
  }
  res.json(room);
};

export const leaveRoom = async (req: Request, res: Response) => {
  const { roomId, userId } = req.body;
  const roomRepo = AppDataSource.getRepository(Room);
  const room = await roomRepo.findOne({ where: { id: roomId }, relations: ['users'] });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  room.users = room.users.filter(u => u.id !== userId);
  room.participantCount = room.users.length;
  await roomRepo.save(room);
  res.json(room);
};

// Join room by invite code
export const joinRoomByInvite = async (req: Request, res: Response) => {
  const { inviteCode, userId } = req.body;
  const roomRepo = AppDataSource.getRepository(Room);
  const userRepo = AppDataSource.getRepository(User);
  
  const room = await roomRepo.findOne({ 
    where: { inviteCode }, 
    relations: ['users'] 
  });
  
  if (!room) return res.status(404).json({ error: 'Invalid invite code' });
  
  if (room.users.length >= room.maxParticipants) {
    return res.status(400).json({ error: 'Room is full' });
  }
  
  const user = await userRepo.findOneBy({ id: userId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (!room.users.find(u => u.id === userId)) {
    room.users.push(user);
    room.participantCount = room.users.length;
    await roomRepo.save(room);
  }
  
  res.json(room);
};

// Update conversation metrics
export const updateConversationMetrics = async (req: Request, res: Response) => {
  const { roomId, metrics } = req.body;
  const roomRepo = AppDataSource.getRepository(Room);
  
  const room = await roomRepo.findOneBy({ id: roomId });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  
  room.conversationMetrics = {
    ...room.conversationMetrics,
    ...metrics,
    lastActivity: new Date()
  };
  
  await roomRepo.save(room);
  res.json({ success: true, metrics: room.conversationMetrics });
};

// Get AI moderation suggestions
export const getAIModerationSuggestion = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const roomRepo = AppDataSource.getRepository(Room);
  
  const room = await roomRepo.findOne({
    where: { id: parseInt(roomId) },
    relations: ['messages']
  });
  
  if (!room) return res.status(404).json({ error: 'Room not found' });
  
  if (!room.aiModerationEnabled) {
    return res.status(400).json({ error: 'AI moderation not enabled for this room' });
  }
  
  try {
    const ai = getAIProvider('gemini');
    
    // Get recent conversation context
    const recentMessages = room.messages
      .slice(-10)
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');
    
    const prompt = `You are an AI moderator for a ${room.chatMode || 'balanced'} group chat room called "${room.name}".
    
Recent conversation:
${recentMessages || 'No recent messages.'}

Room settings:
- Chat mode: ${room.chatMode || 'balanced'}
- Engagement level: ${room.aiSettings?.engagementLevel || 'medium'}

Based on the conversation context and room settings, suggest a helpful topic or make a brief, engaging comment to keep the conversation flowing. Be natural and match the room's personality. Keep it short and conversational.`;

    const suggestion = await ai.generateResponse(prompt);
    
    res.json({ 
      suggestion: suggestion.trim(),
      roomId: room.id,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('AI moderation error:', error);
    res.status(500).json({ error: 'Failed to get AI suggestion' });
  }
};
