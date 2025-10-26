import type { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AppDataSource } from '../config/data-source';
import { Message, IMessage } from '../entities/Message';
import { getPersonalityById, DEFAULT_PERSONALITY, type GhostPersonality } from '../utils/ghostPersonalities';

// Initialize Google's Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Generate a spooky response from the ghost using Gemini API with personality
const generateGhostResponse = async (
  userMessage: string, 
  messageHistory: IMessage[] = [], 
  personalityId?: string
): Promise<string> => {
  try {
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
    // Log result shape keys to help debug SDK differences (trimmed, no secrets)
    try {
      const rkeys = result && typeof result === 'object' ? Object.keys(result) : [];
      console.log('Generative SDK result keys:', rkeys);
    } catch (e) {
      console.warn('Could not enumerate result keys');
    }
    const response = await result.response;
    try {
      const keys = response && typeof response === 'object' ? Object.keys(response) : [];
      console.log('Generative SDK response keys:', keys);
    } catch (e) {
      console.warn('Could not enumerate response keys');
    }

    // Resilient extractor for different SDK response shapes
    const extractResponseText = async (resp: any): Promise<string> => {
      try {
        // If SDK exposes a text() method (sync or async)
        if (resp && typeof resp.text === 'function') {
          const maybe = resp.text();
          return typeof maybe.then === 'function' ? await maybe : String(maybe);
        }

        // Newer shapes: response.output[0].content is an array of { type: 'output_text', text }
        if (resp?.output && Array.isArray(resp.output)) {
          // try to join any text parts
          const out = resp.output
            .map((o: any) => {
              if (typeof o === 'string') return o;
              if (o?.content && Array.isArray(o.content)) {
                return o.content.map((c: any) => c.text || '').join('');
              }
              return o?.text || '';
            })
            .filter(Boolean)
            .join('\n');
          if (out) return out;
        }

        // Some responses put candidates content inside `candidates` or `output_captions`
        if (resp?.candidates && Array.isArray(resp.candidates) && resp.candidates[0]) {
          const c = resp.candidates[0];
          if (c?.content && Array.isArray(c.content)) {
            return c.content.map((pc: any) => pc.text || '').join('');
          }
          if (c?.message) return String(c.message);
        }

        // Fallback: stringify plain object with possible text fields
        if (typeof resp === 'string') return resp;
        if (resp?.text) return String(resp.text);
        if (resp?.message) return String(resp.message);

        // Last resort, try to JSON stringify a small portion for debugging
        try {
          return JSON.stringify(resp).slice(0, 2000);
        } catch {
          return '';
        }
      } catch (e) {
        console.error('Error extracting response text shape:', e);
        return '';
      }
    };

    const responseText = await extractResponseText(response);
    // Log the shape we received minimally for debugging (don't log secrets)
    try {
        if (responseText && responseText.trim().length > 0) {
          console.log('Ghost response (trimmed):', responseText.slice(0, 500));
        } else {
          // If empty, dump safe diagnostics so we can see what's coming back from the SDK
          try {
            const keys = response && typeof response === 'object' ? Object.keys(response) : [];
            console.warn('Extractor returned empty text. Response keys:', keys);
          } catch (e) {
            console.warn('Extractor returned empty text and could not enumerate response keys');
          }

          // Try a safe, short JSON preview (non-blocking)
          try {
            const preview = JSON.stringify(response, Object.keys(response || {}).slice(0, 20)).slice(0, 1000);
            console.warn('Response preview (trimmed):', preview);
          } catch (e) {
            console.warn('Could not stringify response preview');
          }

          console.warn('Will use atmospheric fallback (non-echoing) instead of verbatim echo.');
        }
    } catch (e) {
      console.warn('Unable to log response text:', e);
    }

    // If the model returned nothing or only ellipses, return a minimal placeholder so the client decides how to display it
    if (!responseText || responseText.trim().length < 3 || /^\.*$/.test(responseText.trim())) {
      console.warn('Generated response was empty or minimal; returning placeholder');
      return '...';
    }

    return responseText || '...';
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error('Error generating ghost response:', error && (error.stack || error));
    try {
      if (error && error.response) {
        console.error('Error response details:', JSON.stringify(error.response).slice(0, 2000));
      }
    } catch (e) {
      // ignore stringify errors
    }

    // On error, return a minimal placeholder so the client can decide how to display it.
    return '...';
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
    const { content, sessionId, personalityId } = req.body;
    
    // Save user message
    await saveMessage(content, false, sessionId);
    
    // Get recent messages for context
    const messageRepository = AppDataSource.getRepository(Message);
    const recentMessages = await messageRepository.find({
      where: { sessionId },
      order: { createdAt: 'DESC' },
      take: 5
    });
    
    // Generate ghost response with personality
    const ghostResponse = await generateGhostResponse(content, recentMessages.reverse(), personalityId);
    
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
