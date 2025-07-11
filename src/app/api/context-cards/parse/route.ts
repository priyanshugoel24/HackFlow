import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { input, projectId } = await req.json();

    if (!input || !projectId) {
      return NextResponse.json({ error: "Missing input or projectId" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an assistant that helps parse natural language into structured data to create a context card.

User input:
${input}

Extract and return a JSON object in the format:
{
  "title": string,
  "content": string,
  "type": "TASK" | "INSIGHT" | "DECISION",
  "visibility": "PUBLIC" | "PRIVATE"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = await response.text();

    const jsonStart = rawText.indexOf("{");
    const jsonEnd = rawText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Response does not contain valid JSON");
    }

    const jsonString = rawText.slice(jsonStart, jsonEnd + 1);
    const parsedCard = JSON.parse(jsonString);

    if (
      !parsedCard.title ||
      !parsedCard.content ||
      !parsedCard.type ||
      !parsedCard.visibility
    ) {
      return NextResponse.json({ error: "Incomplete parsed card data" }, { status: 400 });
    }

    return NextResponse.json({ parsedCard }, { status: 200 });
  } catch (error) {
    console.error("Gemini parsing error:", error);
    return NextResponse.json({ error: "Failed to parse input with Gemini" }, { status: 500 });
  }
}