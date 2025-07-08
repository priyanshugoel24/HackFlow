// POST: Create a new comment
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, cardId, parentId } = await req.json();

  if (!content || !cardId)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        cardId,
        parentId: parentId || null,
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