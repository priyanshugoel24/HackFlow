import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function summarizeWithGemini(content: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Summarize this content:\n\n${content}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}