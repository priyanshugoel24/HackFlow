import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        children: {
          include: { author: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Error fetching comment" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET
  });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // First, ensure the user exists in the database and get the actual user
  const user = await prisma.user.upsert({
    where: { email: token.email! },
    update: {
      name: token.name,
      image: token.picture,
    },
    create: {
      email: token.email!,
      name: token.name,
      image: token.picture,
    },
  });

  const { content } = await req.json();
  const { id } = await params;

  try {
    const existing = await prisma.comment.findUnique({
      where: { id },
    });

    if (!existing || existing.authorId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await prisma.comment.update({
      where: { id },
      data: { content },
    });

    return NextResponse.json({ comment: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET
  });
  if (!token?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // First, ensure the user exists in the database and get the actual user
  const user = await prisma.user.upsert({
    where: { email: token.email! },
    update: {
      name: token.name,
      image: token.picture,
    },
    create: {
      email: token.email!,
      name: token.name,
      image: token.picture,
    },
  });

  try {
    const { id } = await params;
    const existing = await prisma.comment.findUnique({ where: { id } });
    if (!existing || existing.authorId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}