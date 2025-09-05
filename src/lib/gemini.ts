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
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set");
      }

      const model = genAI.getGenerativeModel({
        model: options?.model || geminiConfig.MODEL,
        generationConfig: {
          maxOutputTokens: options?.maxOutputTokens || geminiConfig.MAX_OUTPUT_TOKENS,
          temperature: options?.temperature || geminiConfig.TEMPERATURE,
        },
      });

      console.log("Generating content with model:", options?.model || geminiConfig.MODEL);
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error("Gemini returned empty response");
      }
      
      console.log("Gemini response length:", text.length);
      return text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      if (error instanceof Error) {
        throw new Error(`Gemini failed to generate content: ${error.message}`);
      } else {
        throw new Error("Gemini failed to generate content: Unknown error");
      }
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