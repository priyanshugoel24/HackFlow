import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiConfig } from "@/config/gemini";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const gemini = {
  async generateContent(
    prompt: string, 
    options?: {
      model?: string;
      maxOutputTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({
        model: options?.model || geminiConfig.MODEL,
        generationConfig: {
          maxOutputTokens: options?.maxOutputTokens || geminiConfig.MAX_OUTPUT_TOKENS,
          temperature: options?.temperature || geminiConfig.TEMPERATURE,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Gemini failed to generate content.");
    }
  },

  // Convenience methods for specific use cases
  async generateAssistantContent(prompt: string): Promise<string> {
    return this.generateContent(prompt, {
      model: geminiConfig.ASSISTANT_MODEL,
      maxOutputTokens: geminiConfig.ASSISTANT_MAX_TOKENS,
      temperature: geminiConfig.ASSISTANT_TEMPERATURE,
    });
  },

  async summarizeContent(prompt: string): Promise<string> {
    return this.generateContent(prompt, {
      model: geminiConfig.SUMMARIZE_MODEL,
      maxOutputTokens: geminiConfig.SUMMARIZE_MAX_TOKENS,
    });
  },
};