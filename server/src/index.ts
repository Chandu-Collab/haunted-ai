import 'reflect-metadata';
// Load environment variables early (ensures other modules see process.env)
import './config/env';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import chatRoutes from './routes/chatRoutes';
import interactionRoutes from './routes/interactionRoutes';
import { AppDataSource } from './config/data-source';
import { Message } from './entities/Message';

// Environment variables are loaded by `src/config/env` above.

// Initialize Express app
const app = express();

// Middleware: enable CORS for the configured client origin
const CLIENT_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';
// Allow common HTTP methods and the Authorization header for authenticated requests.
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
connectDB();

// Test database connection (use connectDB which is idempotent)
const testConnection = async () => {
  try {
    await connectDB();
    if (!AppDataSource.isInitialized) {
      throw new Error('AppDataSource was not initialized');
    }

    console.log('Database connection established');

    // Test query
    const messageRepository = AppDataSource.getRepository(Message);
    const count = await messageRepository.count();
    console.log(`Connected to database. Found ${count} messages.`);

  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
};

testConnection();

// Routes
app.use('/api/chat', chatRoutes);
// Minimal interactions API (achievements / energy / rooms)
app.use('/api/interactions', interactionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', database: AppDataSource.isInitialized ? 'connected' : 'disconnected' });
});

// Start server
const PORT = process.env.PORT || 5000;

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  
  // Close the database connection
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Database connection closed');
  }
  
  process.exit(0);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
