import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
console.log(`Loading environment from ${envPath}`);
config({ path: envPath });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in the environment variables.");
}
const parsedUrl = new URL(databaseUrl);

const dbConfig = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || "5432"),
  username: parsedUrl.username,
  password: decodeURIComponent(parsedUrl.password),
  database: parsedUrl.pathname.slice(1),
};

async function checkAIMemoryTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
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