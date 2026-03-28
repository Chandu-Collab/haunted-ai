import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type GhostPersonalityTrait = 'friendly' | 'mysterious' | 'mischievous' | 'wise' | 'playful' | 'dark' | 'protective' | 'ancient';
export type VoiceTone = 'whisper' | 'echo' | 'normal' | 'deep' | 'high' | 'robotic' | 'ethereal';
export type ActivityLevel = 'passive' | 'moderate' | 'active' | 'very_active';

// Seed initial data for the haunted-ai application
import '../config/env'
import { AppDataSource } from '../config/data-source'
import { User } from '../entities/User'
import { Room } from '../entities/Room'
import { GhostProfile } from '../entities/GhostProfile'
import { v4 as uuidv4 } from 'uuid'

async function seed() {
  try {
    console.log('Initializing database connection...')
    await AppDataSource.initialize()
    console.log('Database connected')

    const userRepository = AppDataSource.getRepository(User)
    const roomRepository = AppDataSource.getRepository(Room)
    const ghostRepository = AppDataSource.getRepository(GhostProfile)

    // Check if data already exists
    const existingUsers = await userRepository.count()
    const existingRooms = await roomRepository.count()
    const existingGhosts = await ghostRepository.count()

    console.log(`Existing data: ${existingUsers} users, ${existingRooms} rooms, ${existingGhosts} ghosts`)

    if (existingUsers > 0 || existingRooms > 0 || existingGhosts > 0) {
      console.log('Database already has data. Skipping seed.')
      await AppDataSource.destroy()
      process.exit(0)
    }

    // Create sample rooms
    console.log('Creating rooms...')
    const rooms = [
      {
        name: 'Grand Entrance Hall',
        description: 'A majestic hall with towering ceilings, dusty chandeliers, and mysterious portraits that seem to watch your every move.',
        type: 'haunted' as const,
        privacy: 'public' as const,
        maxParticipants: 10,
        decorations: { chandeliers: true, portraits: true, red_carpet: true }
      },
      {
        name: 'Library of Whispers',
        description: 'Ancient books line the walls, their pages filled with forgotten knowledge. The air smells of old parchment and secrets.',
        type: 'haunted' as const,
        privacy: 'public' as const,
        maxParticipants: 8,
        decorations: { books: true, fireplace: true, reading_chairs: true }
      },
      {
        name: 'Ballroom of Shadows',
        description: 'A once-grand ballroom where spectral dancers still waltz to unheard music. Mirrors reflect more than just the living.',
        type: 'haunted' as const,
        privacy: 'public' as const,
        maxParticipants: 15,
        decorations: { piano: true, mirrors: true, chandelier: true }
      },
      {
        name: 'Dungeon Depths',
        description: 'Dark, damp corridors echo with the whispers of prisoners long forgotten. Chains rattle in the darkness.',
        type: 'haunted' as const,
        privacy: 'public' as const,
        maxParticipants: 6,
        decorations: { chains: true, torches: true, cells: true }
      },
      {
        name: 'Attic of Memories',
        description: 'A cluttered attic filled with trunks and artifacts from different eras. Each object holds a story waiting to be told.',
        type: 'haunted' as const,
        privacy: 'public' as const,
        maxParticipants: 8,
        decorations: { trunks: true, old_furniture: true, windows: true }
      }
    ]

    const createdRooms = await roomRepository.save(rooms)
    console.log(`Created ${createdRooms.length} rooms`)

    // Create ghost profiles
    console.log('Creating ghosts...')
    const ghosts = [
      {
        name: 'Lady Eleanor',
        emoji: '👸',
        backstory: 'A Victorian lady who searches for her lost love. She speaks in riddles and poetry.',
        color: '#8B5CF6',
        personalityTraits: ['mysterious', 'wise', 'protective'] as GhostPersonalityTrait[],
        activityLevel: 'moderate' as const,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Captain Blackwood',
        emoji: '🏴‍☠️',
        backstory: 'A pirate captain who guards his treasure. He\'s suspicious of newcomers but loyal to friends.',
        color: '#DC2626',
        personalityTraits: ['protective', 'mysterious', 'mischievous'] as GhostPersonalityTrait[],
        activityLevel: 'active' as const,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Little Lily',
        emoji: '👧',
        backstory: 'A child ghost who loves to play games. She\'s lonely and looking for friends to play with forever.',
        color: '#10B981',
        personalityTraits: ['playful', 'friendly', 'mischievous'] as GhostPersonalityTrait[],
        activityLevel: 'very_active' as const,
        isActive: true,
        isFeatured: false
      },
      {
        name: 'The Scholar',
        emoji: '📚',
        backstory: 'An ancient librarian who knows the secrets of the mansion. He speaks in quotes and references.',
        color: '#3B82F6',
        personalityTraits: ['wise', 'mysterious', 'friendly'] as GhostPersonalityTrait[],
        activityLevel: 'passive' as const,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Marcus the Jester',
        emoji: '🃏',
        backstory: 'A court jester who still loves to play tricks. His laughter echoes through the halls.',
        color: '#F59E0B',
        personalityTraits: ['mischievous', 'playful', 'friendly'] as GhostPersonalityTrait[],
        activityLevel: 'active' as const,
        isActive: true,
        isFeatured: false
      }
    ]

    const createdGhosts = await ghostRepository.save(ghosts)
    console.log(`Created ${createdGhosts.length} ghosts`)

    // Create a test user for development
    console.log('Creating test user...')
    const bcrypt = require('bcrypt')
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const testUser = {
      id: uuidv4(),
      email: 'test@haunted-ai.com',
      passwordHash: hashedPassword,
      nickname: 'TestUser',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await userRepository.save(testUser)
    console.log('Created test user: test@haunted-ai.com')

    console.log('\n✅ Database seeded successfully!')
    console.log('\n👻 Available Ghosts:')
    createdGhosts.forEach((ghost, index) => {
      console.log(`${index + 1}. ${ghost.name} - ${ghost.backstory}`)
    })

    console.log('\n🏚️ Available Rooms:')
    createdRooms.forEach((room, index) => {
      console.log(`${index + 1}. ${room.name} - ${room.description}`)
    })

    console.log('\n👤 Test User: test@haunted-ai.com')
    console.log('\n🎮 You can now start using the application locally!')

    await AppDataSource.destroy()
    process.exit(0)
  } catch (error) {
    console.error('Seeding error:', error)
    try { await AppDataSource.destroy() } catch {}
    process.exit(1)
  }
}

seed()
