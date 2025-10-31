// src/ai/providerFactory.ts
import { AIProvider, AIProviderName } from './aiProvider';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';

export function getAIProvider(name: AIProviderName): AIProvider {
  switch (name) {
    case 'gemini':
      return new GeminiProvider();
    case 'openai':
      return new OpenAIProvider();
    // Add more providers as needed
    default:
      throw new Error(`Unknown AI provider: ${name}`);
  }
}
