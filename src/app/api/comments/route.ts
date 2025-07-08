// POST: Create a new comment
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { 
  commentSchema, 
  validateInput, 
  sanitizeText, 
  createRateLimiter 
} from "@/lib/security";

// Rate limiter: 30 comments per minute per user
const rateLimiter = createRateLimiter(60 * 1000, 30);

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limiting
  if (!rateLimiter(token.sub)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { content, cardId, parentId } = await req.json();

  // Validate and sanitize input
  const validationResult = validateInput(commentSchema, {
    content: sanitizeText(content),
    cardId: sanitizeText(cardId),
    parentId: parentId ? sanitizeText(parentId) : undefined
  });

  if (!validationResult.isValid) {
    return NextResponse.json({ 
      error: "Invalid input", 
      details: validationResult.errors 
    }, { status: 400 });
  }

  const validatedData = validationResult.data!;

  try {
    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        cardId: validatedData.cardId,
        parentId: validatedData.parentId || null,
        authorId: token.sub,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment", error);
    return NextResponse.json({ error: "Error creating comment" }, { status: 500 });
  }
}