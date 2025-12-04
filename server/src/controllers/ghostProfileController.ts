import { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { GhostProfile } from '../entities/GhostProfile';

export const getGhostProfiles = async (req: Request, res: Response) => {
  try {
    const { active, featured, createdBy } = req.query;
    const repo = AppDataSource.getRepository(GhostProfile);
    
    let whereClause: any = {};
    if (active !== undefined) whereClause.isActive = active === 'true';
    if (featured !== undefined) whereClause.isFeatured = featured === 'true';
    if (createdBy) whereClause.createdBy = createdBy;
    
    const ghosts = await repo.find({
      where: whereClause,
      order: { isFeatured: 'DESC', updatedAt: 'DESC' }
    });
    
    res.json(ghosts);
  } catch (error) {
    console.error('getGhostProfiles error:', error);
    res.status(500).json({ error: 'Failed to fetch ghost profiles' });
  }
};

export const getGhostProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(GhostProfile);
    const ghost = await repo.findOneBy({ id });
    
    if (!ghost) {
      return res.status(404).json({ error: 'Ghost profile not found' });
    }
    
    res.json(ghost);
  } catch (error) {
    console.error('getGhostProfile error:', error);
    res.status(500).json({ error: 'Failed to fetch ghost profile' });
  }
};

export const createGhostProfile = async (req: Request, res: Response) => {
  try {
    const {
      name,
      backstory,
      emoji = '👻',
      color = '#8a4fff',
      personalityTraits = [],
      activityLevel = 'moderate',
      voiceSettings,
      preferences,
      abilities,
      appearance,
      createdBy
    } = req.body;
    
    const repo = AppDataSource.getRepository(GhostProfile);
    const existing = await repo.findOneBy({ name });
    
    if (existing) {
      return res.status(400).json({ error: 'Ghost with this name already exists' });
    }
    
    const ghost = repo.create({
      name,
      backstory,
      emoji,
      color,
      personalityTraits,
      activityLevel,
      voiceSettings,
      preferences,
      abilities,
      appearance: { ...appearance, color, emoji },
      createdBy,
      stats: {
        timesUsed: 0,
        averageSessionLength: 0,
        favoriteRooms: [],
        userRating: 0
      }
    });
    
    await repo.save(ghost);
    res.status(201).json(ghost);
  } catch (error) {
    console.error('createGhostProfile error:', error);
    res.status(500).json({ error: 'Failed to create ghost profile' });
  }
};

export const updateGhostProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const repo = AppDataSource.getRepository(GhostProfile);
    const ghost = await repo.findOneBy({ id });
    
    if (!ghost) {
      return res.status(404).json({ error: 'Ghost profile not found' });
    }
    
    // Check for name conflicts if name is being updated
    if (updateData.name && updateData.name !== ghost.name) {
      const existing = await repo.findOneBy({ name: updateData.name });
      if (existing) {
        return res.status(400).json({ error: 'Ghost with this name already exists' });
      }
    }
    
    // Update fields
    Object.assign(ghost, updateData);
    
    // Update appearance if emoji or color changed
    if (updateData.emoji || updateData.color) {
      ghost.appearance = {
        ...ghost.appearance,
        ...(updateData.emoji && { emoji: updateData.emoji }),
        ...(updateData.color && { color: updateData.color })
      };
    }
    
    await repo.save(ghost);
    res.json(ghost);
  } catch (error) {
    console.error('updateGhostProfile error:', error);
    res.status(500).json({ error: 'Failed to update ghost profile' });
  }
};

export const deleteGhostProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const repo = AppDataSource.getRepository(GhostProfile);
    const ghost = await repo.findOneBy({ id });
    
    if (!ghost) {
      return res.status(404).json({ error: 'Ghost profile not found' });
    }
    
    await repo.remove(ghost);
    res.json({ success: true, message: 'Ghost profile deleted successfully' });
  } catch (error) {
    console.error('deleteGhostProfile error:', error);
    res.status(500).json({ error: 'Failed to delete ghost profile' });
  }
};

// Update ghost appearance (color, emoji, accessories, etc.)
export const updateGhostAppearance = async (req: Request, res: Response) => {
  try {
    const { id, appearance } = req.body;
    if (!id || !appearance) return res.status(400).json({ error: 'id and appearance required' });
    
    const repo = AppDataSource.getRepository(GhostProfile);
    const ghost = await repo.findOneBy({ id });
    
    if (!ghost) return res.status(404).json({ error: 'Ghost not found' });
    
    ghost.appearance = { ...ghost.appearance, ...appearance };
    await repo.save(ghost);
    
    res.json({ success: true, appearance: ghost.appearance });
  } catch (err) {
    console.error('updateGhostAppearance error', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update ghost usage statistics
export const updateGhostStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sessionLength, roomId, rating } = req.body;
    
    const repo = AppDataSource.getRepository(GhostProfile);
    const ghost = await repo.findOneBy({ id });
    
    if (!ghost) {
      return res.status(404).json({ error: 'Ghost profile not found' });
    }
    
    const currentStats = ghost.stats || {};
    const timesUsed = (currentStats.timesUsed || 0) + 1;
    const currentAvgLength = currentStats.averageSessionLength || 0;
    const newAvgLength = ((currentAvgLength * (timesUsed - 1)) + sessionLength) / timesUsed;
    
    ghost.stats = {
      ...currentStats,
      timesUsed,
      averageSessionLength: Math.round(newAvgLength),
      lastUsed: new Date(),
      ...(roomId && {
        favoriteRooms: [...new Set([...(currentStats.favoriteRooms || []), roomId])]
      }),
      ...(rating && { userRating: rating })
    };
    
    await repo.save(ghost);
    res.json({ success: true, stats: ghost.stats });
  } catch (error) {
    console.error('updateGhostStats error:', error);
    res.status(500).json({ error: 'Failed to update ghost statistics' });
  }
};

// Clone a ghost profile
export const cloneGhostProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, createdBy } = req.body;
    
    const repo = AppDataSource.getRepository(GhostProfile);
    const originalGhost = await repo.findOneBy({ id });
    
    if (!originalGhost) {
      return res.status(404).json({ error: 'Ghost profile not found' });
    }
    
    // Check if new name already exists
    const existing = await repo.findOneBy({ name });
    if (existing) {
      return res.status(400).json({ error: 'Ghost with this name already exists' });
    }
    
    const clonedGhost = repo.create({
      ...originalGhost,
      id: undefined, // Let it generate new ID
      name,
      createdBy,
      stats: {
        timesUsed: 0,
        averageSessionLength: 0,
        favoriteRooms: [],
        userRating: 0
      }
    });
    
    await repo.save(clonedGhost);
    res.status(201).json(clonedGhost);
  } catch (error) {
    console.error('cloneGhostProfile error:', error);
    res.status(500).json({ error: 'Failed to clone ghost profile' });
  }
};
