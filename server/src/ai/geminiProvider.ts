// src/ai/geminiProvider.ts

import { AIProvider } from './aiProvider';
import fetch from 'node-fetch';

// Environment variable loaded dynamically in class
// Use a faster Gemini model for lower latency
const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;


export class GeminiProvider implements AIProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    const GEMINI_API_KEY = process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    try {
      const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: prompt }] }
          ]
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error: ${res.status} ${errText}`);
      }
      const data = await res.json();
      // Gemini API returns candidates[0].content.parts[0].text
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No response from Gemini API');
      return text;
    } catch (err: any) {
      console.error('GeminiProvider error:', err);
      throw new Error('Failed to get response from Gemini API');
    }
  }

  // Streaming support removed (no longer used)
}
