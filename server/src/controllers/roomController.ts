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
    res.status(500).json({ description: 'The spirits are silent... No vision appears.' });
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
  const roomRepo = AppDataSource.getRepository(Room);
  const rooms = await roomRepo.find({ relations: ['users'] });
  res.json(rooms);
};

export const createRoom = async (req: Request, res: Response) => {
  const { name } = req.body;
  const roomRepo = AppDataSource.getRepository(Room);
  const existing = await roomRepo.findOneBy({ name });
  if (existing) return res.status(400).json({ error: 'Room already exists' });
  const room = roomRepo.create({ name });
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
  await roomRepo.save(room);
  res.json(room);
};
