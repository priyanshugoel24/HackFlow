import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Session } from "next-auth";

// Rate limiting map (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configuration constants
const CONFIG = {
  MAX_CONTENT_LENGTH: 8000, // Rough token limit for Gemini
  RATE_LIMIT_REQUESTS: 5, // Max requests per window
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute window
  GEMINI_MODEL: "gemini-2.5-flash", // Use the latest model
  MAX_TOKENS: 150, // Limit response length
};

// Validate environment variables
function validateEnvironment(): string | null {
  if (!process.env.OPENAI_API_KEY) {
    return "OpenAI API key not configured";
  }
  return null;
}

// Rate limiting function
function checkRateLimit(userId: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + CONFIG.RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + CONFIG.RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (userLimit.count >= CONFIG.RATE_LIMIT_REQUESTS) {
    return { 
      allowed: false, 
      error: `Rate limit exceeded. Try again in ${Math.ceil((userLimit.resetTime - now) / 1000)} seconds.` 
    };
  }

  userLimit.count++;
  return { allowed: true };
}

// Content validation function
function validateContent(content: string): string | null {
  if (!content || content.trim().length === 0) {
    return "Card content is empty";
  }
  
  if (content.length > CONFIG.MAX_CONTENT_LENGTH) {
    return `Content too long for summarization (max ${CONFIG.MAX_CONTENT_LENGTH} characters)`;
  }
  
  return null;
}

// Create Gemini client with error handling
function createGeminiClient(): GoogleGenerativeAI | null {
  if (!process.env.GEMINI_API_KEY) {
    console.error("Gemini API key not configured");
    return null;
  }

  try {
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (error) {
    console.error("Failed to create Gemini client:", error);
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Environment validation
    const envError = validateEnvironment();
    if (envError) {
      console.error("Environment validation failed:", envError);
      return NextResponse.json({ error: "Service configuration error" }, { status: 500 });
    }

    // Authentication check
    const session = await getServerSession(authOptions) as Session | null;
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting check
    const rateLimitResult = checkRateLimit(session.user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: rateLimitResult.error }, { status: 429 });
    }

    // Extract and validate parameters
    const { id } = await params;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: "Invalid card ID" }, { status: 400 });
    }

    // Database query to fetch card details with project membership validation
    const card = await prisma.contextCard.findFirst({
      where: { 
        id: id,
      },
      select: {
        id: true,
        content: true,
        summary: true,
        userId: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            members: {
              where: {
                userId: session.user.id,
                status: "ACTIVE"
              },
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if user has access to the project
    if (card.project.members.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if summary already exists and is recent
    if (card.summary && card.summary.trim().length > 0) {
      const timeSinceUpdate = Date.now() - card.updatedAt.getTime();
      const oneHour = 60 * 60 * 1000;
      
      // Return existing summary if it's less than an hour old
      if (timeSinceUpdate < oneHour) {
        return NextResponse.json({ 
          summary: card.summary,
          cached: true,
          message: "Returning existing summary" 
        });
      }
    }

    // Content validation
    const contentError = validateContent(card.content);
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 400 });
    }

    // Create Gemini client
    const gemini = createGeminiClient();
    if (!gemini) {
      return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
    }

    // Prepare prompt with content length consideration
    const truncatedContent = card.content.length > CONFIG.MAX_CONTENT_LENGTH 
      ? card.content.substring(0, CONFIG.MAX_CONTENT_LENGTH) + "..."
      : card.content;

    const prompt = `Summarize the following context in 2-3 sentences. Focus on the main points and key takeaways:

"""
${truncatedContent}
"""`;

    // Gemini API call with enhanced error handling
    const model = gemini.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });
    let summary: string;
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      summary = response.text().trim();
    } catch (error: any) {
      console.error("Gemini API error:", error);
      return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 503 });
    }

    if (!summary || summary.length === 0) {
      console.error("Gemini returned empty summary");
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }

    // Validate summary quality (basic checks)
    if (summary.length < 10) {
      console.warn("Generated summary is very short:", summary);
      return NextResponse.json({ error: "Generated summary is too short" }, { status: 500 });
    }

    // Database update with error handling
    try {
      await prisma.contextCard.update({
        where: { id: id },
        data: { 
          summary,
          updatedAt: new Date() // Explicitly update timestamp
        },
      });
    } catch (dbError) {
      console.error("Database update error:", dbError);
      return NextResponse.json({ error: "Failed to save summary" }, { status: 500 });
    }

    // Success response with additional metadata
    return NextResponse.json({ 
      summary,
      cached: false,
      length: summary.length,
      model: CONFIG.GEMINI_MODEL,
    });

  } catch (error: any) {
    console.error("Unexpected error in summarization:", error);
    
    // Handle specific error types
    if (error.name === 'PrismaClientKnownRequestError') {
      return NextResponse.json({ error: "Database error occurred" }, { status: 500 });
    } else if (error.name === 'PrismaClientUnknownRequestError') {
      return NextResponse.json({ error: "Database connection error" }, { status: 503 });
    } else {
      return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
  }
}
