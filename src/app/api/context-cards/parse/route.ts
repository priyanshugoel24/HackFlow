import { gemini } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { input, projectId } = await req.json();

    if (!input || !projectId) {
      return NextResponse.json({ error: "Missing input or projectId" }, { status: 400 });
    }

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable is not set");
      return NextResponse.json({ 
        error: "AI service is not configured. Please set the GEMINI_API_KEY environment variable.",
        details: "Contact your administrator to configure the AI service." 
      }, { status: 500 });
    }

    const prompt = `
You are an assistant that helps parse natural language into structured data to create a context card.

User input: "${input}"

Instructions:
1. Extract a meaningful title (max 100 characters)
2. Create comprehensive content based on the input
3. Determine the most appropriate type (TASK for actionable items, INSIGHT for knowledge/observations, DECISION for conclusions/choices)
4. Set visibility (PUBLIC for general information, PRIVATE for sensitive/personal content)

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Brief descriptive title",
  "content": "Detailed content based on the input",
  "type": "TASK",
  "visibility": "PUBLIC"
}

Do not include any other text, explanations, or formatting. Only return the JSON object.`;

    console.log("Sending prompt to Gemini:", prompt);
    
    const rawText = await gemini.generateContent(prompt, {
      model: "gemini-2.5-flash",
    });

    console.log("Raw Gemini response:", rawText);

    // More robust JSON extraction
    let jsonString = rawText.trim();
    
    // Remove any markdown code block formatting
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Find JSON object boundaries
    const jsonStart = jsonString.indexOf("{");
    const jsonEnd = jsonString.lastIndexOf("}");
    
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No valid JSON found in response:", rawText);
      return NextResponse.json({ 
        error: "AI response does not contain valid JSON",
        details: `Response: ${rawText.substring(0, 500)}...` 
      }, { status: 500 });
    }

    jsonString = jsonString.slice(jsonStart, jsonEnd + 1);
    console.log("Extracted JSON string:", jsonString);

    let parsedCard;
    try {
      parsedCard = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError, "JSON string:", jsonString);
      return NextResponse.json({ 
        error: "Failed to parse AI response as JSON",
        details: `Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        rawResponse: rawText.substring(0, 500)
      }, { status: 500 });
    }

    // Validate required fields
    const validTypes = ["TASK", "INSIGHT", "DECISION"];
    const validVisibilities = ["PUBLIC", "PRIVATE"];

    if (!parsedCard.title || typeof parsedCard.title !== 'string') {
      return NextResponse.json({ 
        error: "Invalid or missing title field",
        parsedCard 
      }, { status: 400 });
    }

    if (!parsedCard.content || typeof parsedCard.content !== 'string') {
      return NextResponse.json({ 
        error: "Invalid or missing content field",
        parsedCard 
      }, { status: 400 });
    }

    if (!parsedCard.type || !validTypes.includes(parsedCard.type)) {
      return NextResponse.json({ 
        error: "Invalid or missing type field. Must be one of: " + validTypes.join(", "),
        parsedCard 
      }, { status: 400 });
    }

    if (!parsedCard.visibility || !validVisibilities.includes(parsedCard.visibility)) {
      return NextResponse.json({ 
        error: "Invalid or missing visibility field. Must be one of: " + validVisibilities.join(", "),
        parsedCard 
      }, { status: 400 });
    }

    console.log("Successfully parsed card:", parsedCard);
    return NextResponse.json({ parsedCard }, { status: 200 });
  } catch (error) {
    console.error("Gemini parsing error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: "Failed to parse input with Gemini",
      details: errorMessage 
    }, { status: 500 });
  }
}