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
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getPersonalityById, DEFAULT_PERSONALITY } from './utils/ghostPersonalities';

// Environment variables are loaded by `src/config/env` above.

// Initialize Google's Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Generate AI response function with personality support
const generateGhostResponse = async (
  userMessage: string, 
  messageHistory: any[] = [], 
  personalityId?: string
): Promise<string> => {
  try {
    console.log('Generating AI response for:', userMessage);
    
    // Get the selected personality or use default
    const personality = personalityId ? getPersonalityById(personalityId) : null;
    const activePersonality = personality || DEFAULT_PERSONALITY;
    
    // Get the Gemini model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: activePersonality.responseStyle.lengthPreference === 'brief' ? 100 : 
                        activePersonality.responseStyle.lengthPreference === 'moderate' ? 150 : 200,
        temperature: 0.8,
      },
    });

    // Build the conversation history with personality-specific system prompt
    const chatHistory = [
      {
        role: 'system',
        parts: [{
          text: activePersonality.systemPrompt
        }],
      },
      ...messageHistory.slice(-5).map(msg => ({
        role: msg.isGhost ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }]
      }
    ];

    // Start a chat session
    const chat = model.startChat({ history: chatHistory });

    // Send the message and get the response
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    
    let responseText = '';
    
    // Extract response text safely
    if (typeof response.text === 'function') {
      responseText = await response.text();
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      responseText = response.candidates[0].content.parts[0]?.text || '';
    }

    console.log('AI generated response:', responseText);

    // If the model returned nothing, use a fallback
    if (!responseText || responseText.trim().length < 3) {
      const fallbacks = [
        "*whispers from the shadows*",
        "*a cold breeze stirs*",
        "*something moves in the darkness*",
        "*echoes of the past linger*",
        "*the walls remember*"
      ];
      responseText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    return responseText;
  } catch (error: any) {
    console.error('Error generating ghost response:', error);
    
    // Log more details about the error
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    }
    if (error.message) {
      console.error('Error Message:', error.message);
    }
    
    // Return atmospheric fallback on error
    const errorFallbacks = [
      "*silence fills the room*",
      "*the ghost seems distant*", 
      "*whispers fade into nothing*",
      "*shadows shift mysteriously*",
      "*a cold presence lingers*",
      "*something stirs in the darkness*"
    ];
    return errorFallbacks[Math.floor(Math.random() * errorFallbacks.length)];
  }
};

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const CLIENT_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// Middleware: enable CORS only for the configured client origin
app.use(cors({ origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] }));
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
      const { content, sessionId, personalityId } = data;
      const messageRepository = AppDataSource.getRepository(Message);
      
      // Save user message
      const userMessage = new Message();
      userMessage.content = content;
      userMessage.isGhost = false;
      userMessage.sessionId = sessionId;
      await messageRepository.save(userMessage);
      
      // Broadcast the user message to all connected clients
      io.emit('receive_message', {
        content: userMessage.content,
        isGhost: userMessage.isGhost,
        sessionId: userMessage.sessionId,
        timestamp: userMessage.timestamp.toISOString(),
        id: userMessage.id
      });
      
      // Get recent messages for context
      const recentMessages = await messageRepository.find({
        where: { sessionId },
        order: { createdAt: 'DESC' },
        take: 5
      });
      
      // Generate AI ghost response with personality
      const aiResponse = await generateGhostResponse(content, recentMessages.reverse(), personalityId);
      
      // Save ghost response
      const ghostResponse = new Message();
      ghostResponse.content = aiResponse;
      ghostResponse.isGhost = true;
      ghostResponse.sessionId = sessionId;
      await messageRepository.save(ghostResponse);
      
      // Broadcast ghost response after a short delay for dramatic effect
      setTimeout(() => {
        io.emit('receive_message', {
          content: ghostResponse.content,
          isGhost: ghostResponse.isGhost,
          sessionId: ghostResponse.sessionId,
          timestamp: ghostResponse.timestamp.toISOString(),
          id: ghostResponse.id
        });
      }, 1500); // Slightly longer delay for more dramatic effect
      
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
