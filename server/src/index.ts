import 'reflect-metadata';
// Load environment variables early (ensures other modules see process.env)
import './config/env';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectDB } from './config/db';
import chatRoutes from './routes/chatRoutes';
import { AppDataSource } from './config/data-source';
import { Message } from './entities/Message';

// Environment variables are loaded by `src/config/env` above.

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', database: AppDataSource.isInitialized ? 'connected' : 'disconnected' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      const { content, sessionId } = data;
      const messageRepository = AppDataSource.getRepository(Message);
      
      // Save user message
      const userMessage = new Message();
      userMessage.content = content;
      userMessage.isGhost = false;
      userMessage.sessionId = sessionId;
      await messageRepository.save(userMessage);
      
      // Broadcast the message to all connected clients
      io.emit('receive_message', {
        content: userMessage.content,
        isGhost: userMessage.isGhost,
        sessionId: userMessage.sessionId,
        timestamp: userMessage.timestamp.toISOString(),
        id: userMessage.id
      });
      
      // Generate and send ghost response
      const ghostResponse = new Message();
      ghostResponse.content = '... (ghostly whisper) ...';
      ghostResponse.isGhost = true;
      ghostResponse.sessionId = sessionId;
      await messageRepository.save(ghostResponse);
      
      // Broadcast ghost response after a short delay
      setTimeout(() => {
        io.emit('receive_message', {
          content: ghostResponse.content,
          isGhost: ghostResponse.isGhost,
          sessionId: ghostResponse.sessionId,
          timestamp: ghostResponse.timestamp.toISOString(),
          id: ghostResponse.id
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
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
  
  // Close the server
  server.close(async () => {
    console.log('Server closed');
    
    // Close the database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
    
    process.exit(0);
  });

  // Force close server after 5 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
