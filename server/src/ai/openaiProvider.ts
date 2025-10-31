// src/ai/openaiProvider.ts
import { AIProvider } from './aiProvider';
// import OpenAI SDK as needed

export class OpenAIProvider implements AIProvider {
  async generateResponse(prompt: string, options?: any): Promise<string> {
    // TODO: Integrate OpenAI SDK here
    // Example: return await openai.createCompletion({ prompt, ...options });
    return 'OpenAI response (mock)';
  }
}
