import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
console.log(`Loading environment from ${envPath}`);
config({ path: envPath });

async function checkAIMemoryTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'aws-1-ap-southeast-1.pooler.supabase.com',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'haunted_ai',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Check for AI memory tables
    const tables = [
      'user_memories',
      'ghost_relationships', 
      'sentiment_analysis'
    ];

    for (const tableName of tables) {
      try {
        const result = await dataSource.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [tableName]);
        
        const exists = result[0].count > 0;
        console.log(`📋 Table '${tableName}': ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        
        if (exists) {
          const countResult = await dataSource.query(`SELECT COUNT(*) as records FROM ${tableName}`);
          console.log(`   └── Records: ${countResult[0].records}`);
        }
      } catch (error) {
        console.log(`📋 Table '${tableName}': ❌ ERROR - ${error}`);
      }
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

checkAIMemoryTables();