// Update ghost appearance (color, emoji, accessories, etc.)
export const updateGhostAppearance = async (req: Request, res: Response) => {
  try {
    const { id, appearance } = req.body;
    if (!id || !appearance) return res.status(400).json({ error: 'id and appearance required' });
    const repo = AppDataSource.getRepository(GhostProfile);
    const ghost = await repo.findOneBy({ id });
    if (!ghost) return res.status(404).json({ error: 'Ghost not found' });
    ghost.appearance = appearance;
    await repo.save(ghost);
    res.json({ success: true, appearance });
  } catch (err) {
    console.error('updateGhostAppearance error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { GhostProfile } from '../entities/GhostProfile';

export const getGhostProfiles = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(GhostProfile);
  const ghosts = await repo.find();
  res.json(ghosts);
};

export const createGhostProfile = async (req: Request, res: Response) => {
  const { name, backstory, emoji, color } = req.body;
  const repo = AppDataSource.getRepository(GhostProfile);
  const existing = await repo.findOneBy({ name });
  if (existing) return res.status(400).json({ error: 'Ghost with this name already exists' });
  const ghost = repo.create({ name, backstory, emoji, color });
  await repo.save(ghost);
  res.status(201).json(ghost);
};
