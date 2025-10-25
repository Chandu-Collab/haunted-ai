import { AppDataSource } from './data-source';

export const connectDB = async () => {
  try {
    // Initialize only if not already initialized (idempotent)
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('PostgreSQL Connected');
    } else {
      console.log('PostgreSQL already initialized');
    }
    return AppDataSource;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    // rethrow so callers can decide how to handle termination
    throw error;
  }
};

export default connectDB;
