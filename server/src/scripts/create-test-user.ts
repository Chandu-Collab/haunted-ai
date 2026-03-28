// Create a test user for development
import '../config/env'
import { AppDataSource } from '../config/data-source'
import { User } from '../entities/User'
import { v4 as uuidv4 } from 'uuid'
import * as crypto from 'crypto'

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, usedSalt, 64)
  return `${usedSalt}:${derived.toString('hex')}`
}

async function createTestUser() {
  try {
    console.log('Initializing database connection...')
    await AppDataSource.initialize()
    console.log('Database connected')

    const userRepository = AppDataSource.getRepository(User)

    // Check if test user already exists
    const existingUser = await userRepository.findOne({ 
      where: { email: 'test@haunted-ai.com' } 
    })

    if (existingUser) {
      console.log('Test user already exists: test@haunted-ai.com')
      await AppDataSource.destroy()
      process.exit(0)
    }

    // Create test user
    console.log('Creating test user...')
    const hashedPassword = hashPassword('password123')
    
    const testUser = {
      id: uuidv4(),
      email: 'test@haunted-ai.com',
      passwordHash: hashedPassword,
      nickname: 'TestUser',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await userRepository.save(testUser)
    console.log('✅ Test user created successfully!')
    console.log('📧 Email: test@haunted-ai.com')
    console.log('🔑 Password: password123')

    await AppDataSource.destroy()
    process.exit(0)
  } catch (error) {
    console.error('Error creating test user:', error)
    try { await AppDataSource.destroy() } catch {}
    process.exit(1)
  }
}

createTestUser()
