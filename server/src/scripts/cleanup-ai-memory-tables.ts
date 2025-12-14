import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
config({ path: envPath });

async function cleanupAIMemoryTables() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'haunted_ai',
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Drop existing problematic tables
    const tablesToDrop = [
      'user_memories',
      'ghost_relationships', 
      'sentiment_analysis'
    ];

    for (const tableName of tablesToDrop) {
      try {
        // Check if table exists first
        const result = await dataSource.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_name = $1 AND table_schema = 'public'
        `, [tableName]);
        
        if (result[0].count > 0) {
          console.log(`🗑️ Dropping table '${tableName}'...`);
          await dataSource.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
          console.log(`✅ Table '${tableName}' dropped successfully`);
        } else {
          console.log(`ℹ️ Table '${tableName}' does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error dropping table '${tableName}':`, error);
      }
    }

    // Drop related indexes and enums that might exist
    const indexesToDrop = [
      'idx_user_memories_user_id',
      'idx_user_memories_type',
      'idx_user_memories_importance',
      'idx_ghost_relationships_user_ghost',
      'idx_sentiment_analysis_user_date'
    ];

    for (const indexName of indexesToDrop) {
      try {
        await dataSource.query(`DROP INDEX IF EXISTS "${indexName}"`);
        console.log(`✅ Index '${indexName}' dropped`);
      } catch (error) {
        // Ignore errors for non-existent indexes
        console.log(`ℹ️ Index '${indexName}' not found or already dropped`);
      }
    }

    console.log('🎉 Cleanup completed successfully!');
    console.log('You can now run the migration again.');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

cleanupAIMemoryTables();