// src/ai/aiProvider.ts
export interface AIProvider {
  generateResponse(prompt: string, options?: any): Promise<string>;
}

export type AIProviderName = 'gemini' | 'openai' | 'local';

export interface AIProviderConfig {
  name: AIProviderName;
  [key: string]: any;
}
