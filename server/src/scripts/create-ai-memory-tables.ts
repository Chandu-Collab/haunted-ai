import 'reflect-metadata';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
config({ path: join(__dirname, '../../.env') });

import { AppDataSource } from '../config/data-source';
import { UserMemory } from '../entities/UserMemory';
import { GhostRelationship } from '../entities/GhostRelationship';
import { SentimentAnalysis } from '../entities/SentimentAnalysis';

export async function createAIMemoryTables() {
  try {
    console.log('Creating AI Memory tables...');
    
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Check if tables exist and create them if they don't
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Create UserMemory table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_memories (
        id SERIAL PRIMARY KEY,
        "userId" VARCHAR NOT NULL,
        "memoryContent" TEXT NOT NULL,
        "memoryType" VARCHAR DEFAULT 'conversation',
        context TEXT,
        importance FLOAT DEFAULT 5.0,
        "emotionalWeight" FLOAT DEFAULT 1.0,
        tags TEXT,
        embedding TEXT,
        "accessCount" INTEGER DEFAULT 1,
        "lastAccessed" TIMESTAMP,
        "isDecaying" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create GhostRelationship table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ghost_relationships (
        id SERIAL PRIMARY KEY,
        "userId" VARCHAR NOT NULL,
        "ghostPersonalityId" VARCHAR NOT NULL,
        "trustLevel" FLOAT DEFAULT 0.0,
        "intimacyLevel" FLOAT DEFAULT 0.0,
        "fearLevel" FLOAT DEFAULT 0.0,
        "affectionLevel" FLOAT DEFAULT 0.0,
        "conversationCount" INTEGER DEFAULT 0,
        "totalInteractionTime" INTEGER DEFAULT 0,
        "relationshipMilestones" TEXT,
        "personalNicknames" TEXT,
        "sharedMemories" TEXT,
        "conflictHistory" TEXT,
        "relationshipStatus" VARCHAR DEFAULT 'stranger',
        "lastInteraction" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create SentimentAnalysis table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sentiment_analysis (
        id SERIAL PRIMARY KEY,
        "userId" VARCHAR NOT NULL,
        "messageId" VARCHAR NOT NULL,
        "messageContent" TEXT NOT NULL,
        "overallSentiment" FLOAT NOT NULL,
        "emotionJoy" FLOAT NOT NULL,
        "emotionSadness" FLOAT NOT NULL,
        "emotionAnger" FLOAT NOT NULL,
        "emotionFear" FLOAT NOT NULL,
        "emotionSurprise" FLOAT NOT NULL,
        "emotionDisgust" FLOAT NOT NULL,
        "stressLevel" FLOAT NOT NULL,
        "engagementLevel" FLOAT NOT NULL,
        "detectedTopics" TEXT,
        "contextualFactors" TEXT,
        "analysisDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON user_memories("userId");
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_memories_type ON user_memories("userId", "memoryType");
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_memories_importance ON user_memories("userId", importance) WHERE importance > 7;
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_ghost_relationships_user_ghost ON ghost_relationships("userId", "ghostPersonalityId");
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_user_date ON sentiment_analysis("userId", "analysisDate");
    `);

    await queryRunner.release();
    
    console.log('✅ AI Memory tables created successfully!');
    
    // Insert some sample data for testing
    await insertSampleData();
    
  } catch (error) {
    console.error('❌ Error creating AI Memory tables:', error);
    throw error;
  }
}

async function insertSampleData() {
  try {
    console.log('Inserting sample AI Memory data...');
    
    const memoryRepo = AppDataSource.getRepository(UserMemory);
    
    // Check if sample data already exists
    const existingMemories = await memoryRepo.count();
    
    if (existingMemories === 0) {
      // Insert sample memories (assuming user ID exists)
      const sampleMemories = [
        {
          userId: '1', // Using string ID to match UUID format
          memoryContent: "I love horror movies and scary stories",
          memoryType: 'preference',
          importance: 7.5,
          emotionalWeight: 2.0,
          tags: JSON.stringify(['entertainment', 'horror', 'preferences'])
        },
        {
          userId: '1',
          memoryContent: "I mentioned I'm feeling anxious about work lately",
          memoryType: 'emotion',
          importance: 8.0,
          emotionalWeight: 3.0,
          tags: JSON.stringify(['work', 'anxiety', 'personal'])
        },
        {
          userId: '1',
          memoryContent: "I shared that I have a pet cat named Shadow",
          memoryType: 'relationship',
          importance: 6.5,
          emotionalWeight: 2.5,
          tags: JSON.stringify(['pets', 'personal', 'family'])
        }
      ];
      
      for (const memory of sampleMemories) {
        const newMemory = memoryRepo.create(memory);
        await memoryRepo.save(newMemory);
      }
      
      console.log('✅ Sample AI Memory data inserted!');
    } else {
      console.log('ℹ️ Sample data already exists, skipping insertion.');
    }
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    // Don't throw here, as this is just sample data
  }
}

// Run this script directly if called
if (require.main === module) {
  createAIMemoryTables()
    .then(() => {
      console.log('Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}