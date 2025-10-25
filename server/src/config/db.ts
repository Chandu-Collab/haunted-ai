import { AppDataSource } from './data-source';

export const connectDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log('PostgreSQL Connected');
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    process.exit(1);
  }
};

export default connectDB;
