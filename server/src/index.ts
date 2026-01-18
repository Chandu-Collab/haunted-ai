import 'reflect-metadata';
// Load environment variables early (ensures other modules see process.env)
import './config/env';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { connectDB } from './config/db';
import chatRoutes from './routes/chatRoutes';
// ...existing code...
import interactionRoutes from './routes/interactionRoutes';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import roomWallpaperRoutes from './routes/roomWallpaperRoutes';
import ghostProfileRoutes from './routes/ghostProfileRoutes';
import gameRoutes from './routes/gameRoutes';
import { AppDataSource } from './config/data-source';
import { Message } from './entities/Message';

import { connectRedis } from './utils/redisClient';

import rateLimit from 'express-rate-limit';

// Environment variables are loaded by `src/config/env` above.

// Initialize Express app
const app = express();

// Middleware: enable CORS for the configured client origin (FIRST - before any routes)
const CLIENT_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 204
}));

import translateMessageRoutes from './routes/translateMessage';
import aiMemoryRoutes from './routes/aiMemoryRoutes';

// Analytics middleware
import { analyticsMiddleware, getAnalytics } from './middleware/analytics';

// Rate Limiting: Prevent spam and abuse
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased for development
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // increased for development
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // increased for development
  message: 'You are sending messages too quickly. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter and analytics middleware to all API routes
app.use('/api/', generalLimiter, analyticsMiddleware);

// Serve uploaded files (room wallpapers, avatars, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection
connectDB();

// Redis connection
connectRedis();

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
app.use('/api/chat', chatLimiter, chatRoutes);
// ...existing code...
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms', roomWallpaperRoutes);
app.use('/api/ghosts', ghostProfileRoutes);
app.use('/api/games', gameRoutes);
// Minimal interactions API (achievements / energy / rooms)
app.use('/api/interactions', interactionRoutes);
// Authentication routes (signup / login)
app.use('/api/auth', authLimiter, authRoutes);
// AI Memory and Translation routes
app.use('/api/translate-message', translateMessageRoutes);
app.use('/api/ai-memory', aiMemoryRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', database: AppDataSource.isInitialized ? 'connected' : 'disconnected' });
});

// Analytics dashboard endpoint (basic JSON)
app.get('/admin/analytics', getAnalytics);

// Start server
const PORT = process.env.PORT || 5000;

// Log the database URL being used
console.log('Using DATABASE_URL:', process.env.DATABASE_URL);

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
