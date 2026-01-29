import type { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { Interaction } from '../entities/Interaction';
import { FindOperator } from 'typeorm';

// NOTE: This controller uses sessionId passed by the client as the key.
// It's intentionally simple and unauthenticated to avoid invasive changes. For production,
// consider adding proper user authentication and authorization.

const parseStringOrArray = (value: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value.join(','); // Adjust logic based on your database requirements
  }
  return value;
};

const getInteraction = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = parseStringOrArray(req.params.sessionId);
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId required' });
      return;
    }

    const repo = AppDataSource.getRepository(Interaction);
    let record = await repo.findOneBy({ sessionId });
    // If the record is claimed by a user and the requester is authenticated but different, deny access
    const requesterId = (req as any).userId as string | undefined;
    if (record && record.userId && requesterId && record.userId !== requesterId) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    if (!record) {
      // Ensure sessionId is a string before creating the record
      record = repo.create({ sessionId: String(sessionId), achievements: [], energy: 80, roomsVisited: [] });
      // if requester is authenticated, set ownership
      if (requesterId) record.userId = requesterId;
      await repo.save(record);
    }

    res.json(record);
  } catch (error) {
    console.error('Error fetching interaction:', error);
    res.status(500).json({ error: 'Failed to fetch interaction' });
  }
};

const upsertInteraction = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId: string = req.params.sessionId as string;
    const payload = req.body || {};
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId required' });
      return;
    }

    const repo = AppDataSource.getRepository(Interaction);
    let record = await repo.findOneBy({ sessionId });
    const requesterId = (req as any).userId as string | undefined;
    if (!record) {
      record = repo.create({ sessionId: String(sessionId), achievements: [], energy: 80, roomsVisited: [] });
      if (requesterId) record.userId = requesterId;
    } else {
      // If record is owned and owner differs from requester, forbid
      if (record.userId && requesterId && record.userId !== requesterId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      // If record is unowned and requester authenticated, claim it
      if (!record.userId && requesterId) record.userId = requesterId;
    }

    // Merge allowed fields only
    if (typeof payload.energy === 'number') record.energy = Math.max(0, Math.min(100, payload.energy));
    if (Array.isArray(payload.achievements)) record.achievements = payload.achievements;
    if (Array.isArray(payload.roomsVisited)) record.roomsVisited = payload.roomsVisited;
    if (payload.meta && typeof payload.meta === 'object') record.meta = payload.meta;

    await repo.save(record);

    res.json(record);
  } catch (error) {
    console.error('Error upserting interaction:', error);
    res.status(500).json({ error: 'Failed to upsert interaction' });
  }
};

const patchInteraction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const payload = req.body || {};
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId required' });
      return;
    }

    const repo = AppDataSource.getRepository(Interaction);
    let record = await repo.findOneBy({ sessionId });
    const requesterId = (req as any).userId as string | undefined;
    if (!record) {
      record = repo.create({ sessionId: String(sessionId), achievements: [], energy: 80, roomsVisited: [] });
      if (requesterId) record.userId = requesterId;
    } else {
      if (record.userId && requesterId && record.userId !== requesterId) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      if (!record.userId && requesterId) record.userId = requesterId;
    }

    // apply minimal merge semantics for small updates
    if (typeof payload.energy === 'number') record.energy = Math.max(0, Math.min(100, payload.energy));
    if (Array.isArray(payload.addAchievements)) {
      const addAch: any[] = payload.addAchievements;
      const left = (record.achievements || []).map(a => [a.id, a] as [string, any]);
      const right = addAch.map((a: any) => [a.id, a] as [string, any]);
      record.achievements = Array.from(new Map([...left, ...right] as [string, any][]).values()) as any[];
    }
    if (Array.isArray(payload.addRooms)) {
      record.roomsVisited = Array.from(new Set([...(record.roomsVisited || []), ...payload.addRooms]));
    }

    if (payload.meta && typeof payload.meta === 'object') record.meta = { ...(record.meta || {}), ...payload.meta };

    await repo.save(record);
    res.json(record);
  } catch (error) {
    console.error('Error patching interaction:', error);
    res.status(500).json({ error: 'Failed to patch interaction' });
  }
};

export { getInteraction, upsertInteraction, patchInteraction };
