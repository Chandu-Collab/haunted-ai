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
