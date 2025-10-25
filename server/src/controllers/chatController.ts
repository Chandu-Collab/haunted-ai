import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppDataSource } from '../config/data-source';
import { Message, IMessage } from '../entities/Message';

// Initialize Google's Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Generate a spooky response from the ghost using Gemini API
const generateGhostResponse = async (userMessage: string, messageHistory: IMessage[] = []): Promise<string> => {
  try {
    // Get the Gemini Pro model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.8,
      },
    });

    // Build the conversation history
    const chatHistory = [
      {
        role: 'user',
        parts: [{ 
          text: `You are a ghostly presence in an abandoned house. You start off mysterious but gradually become more personal and unsettling. 
          You know things about the user that you shouldn't. Your responses should be eerie, with occasional typos, delays, and glitchy behavior.
          Keep responses relatively short and atmospheric.` 
        }],
      },
      {
        role: 'model',
        parts: [{ 
          text: '*ethereal whisper* I hear you... The walls have ears in this place...' 
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
    const chat = model.startChat({
      history: chatHistory,
    });

    // Send the message and get the response
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text() || '...';
  } catch (error) {
    console.error('Error generating ghost response:', error);
    return '... (the ghostly presence fades in and out of static) ...';
  }
};

// Save a message to the database
const saveMessage = async (content: string, isGhost: boolean, sessionId: string): Promise<Message> => {
  const message = new Message();
  message.content = content;
  message.isGhost = isGhost;
  message.sessionId = sessionId;
  
  const messageRepository = AppDataSource.getRepository(Message);
  return await messageRepository.save(message);
};

// Get chat history
const getChatHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const messageRepository = AppDataSource.getRepository(Message);
    
    const messages = await messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
      take: 50
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

// Send a message and get ghost response
const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, sessionId } = req.body;
    
    // Save user message
    await saveMessage(content, false, sessionId);
    
    // Get recent messages for context
    const messageRepository = AppDataSource.getRepository(Message);
    const recentMessages = await messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 5
    });
    
    // Generate ghost response
    const ghostResponse = await generateGhostResponse(content, recentMessages.reverse());
    
    // Save ghost response
    await saveMessage(ghostResponse, true, sessionId);
    
    // Get updated message history
    const messages = await messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' }
    });
    
    res.json(messages);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

export {
  getChatHistory,
  sendMessage
};
