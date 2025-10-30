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
