import 'reflect-metadata';
// Load environment variables early
import '../config/env';
import { connectDB } from '../config/db';
import { AppDataSource } from '../config/data-source';
import { Message } from '../entities/Message';

const run = async () => {
  try {
    console.log('Starting DB check...');
    await connectDB();

    if (!AppDataSource.isInitialized) {
      throw new Error('AppDataSource was not initialized');
    }

    console.log('Database connection established');

    // Run a simple query to verify access
    const messageRepository = AppDataSource.getRepository(Message);
    const count = await messageRepository.count();
    console.log(`Connected to DB. Message count: ${count}`);

    // Close the connection gracefully
    await AppDataSource.destroy();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('DB check failed:', error);
    // Ensure the data source is destroyed if initialized
    try {
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
};

run();
