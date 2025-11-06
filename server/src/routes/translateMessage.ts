// src/routes/translateMessage.ts
import express from 'express';
import { getAIProvider } from '../ai/providerFactory';

const router = express.Router();

// POST /api/translate-message
router.post('/', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing text or targetLang' });
  }
  try {
    // Use Gemini to translate the message
    const aiProvider = getAIProvider('gemini');
    const prompt = `Translate the following message to ${targetLang}. Only output the translation, no explanation.\nMessage: ${text}`;
    const translated = await aiProvider.generateResponse(prompt);
    res.json({ translatedText: translated });
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: 'Translation error', details: errorMessage });
  }
});

export default router;
