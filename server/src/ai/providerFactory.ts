// src/ai/providerFactory.ts
import { AIProvider, AIProviderName } from './aiProvider';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';

export function getAIProvider(name: AIProviderName): AIProvider {
  // Always return GeminiProvider, ignore requested name
  return new GeminiProvider();
}
