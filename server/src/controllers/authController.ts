
import type { Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Update user nickname
export async function updateNickname(req: Request, res: Response) {
  try {
    const userId = req.body.userId;
    const { nickname } = req.body;
    if (!userId || !nickname) return res.status(400).json({ error: 'User ID and nickname required' });
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.nickname = nickname;
    await repo.save(user);
    return res.json({ success: true, nickname });
  } catch (err) {
    console.error('updateNickname error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Update user avatar
export async function updateAvatar(req: Request, res: Response) {
  try {
    const userId = req.body.userId;
    const { avatarUrl } = req.body;
    if (!userId || !avatarUrl) return res.status(400).json({ error: 'User ID and avatarUrl required' });
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOneBy({ id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.avatarUrl = avatarUrl;
    await repo.save(user);
    return res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('updateAvatar error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, usedSalt, 64)
  return `${usedSalt}:${derived.toString('hex')}`
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'))
}

export async function signup(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const repo = AppDataSource.getRepository(User)
    const existing = await repo.findOneBy({ email })
    if (existing) return res.status(409).json({ error: 'User already exists' })

    const passwordHash = hashPassword(password)
    const user = repo.create({ email, passwordHash })
    await repo.save(user)

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    return res.status(201).json({ token, user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('signup error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const repo = AppDataSource.getRepository(User)
    const user = await repo.findOneBy({ email })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    return res.json({ token, user: { id: user.id, email: user.email } })
  } catch (err) {
    console.error('login error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
