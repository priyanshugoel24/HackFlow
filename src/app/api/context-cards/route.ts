
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// GET all context cards for logged-in user
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    // First, ensure the user exists in the database
    const user = await prisma.user.upsert({
      where: { id: token.sub },
      update: {},
      create: {
        id: token.sub,
        email: token.email,
        name: token.name,
        image: token.picture,
      },
    });

    const cards = await prisma.contextCard.findMany({
      where: { 
        userId: token.sub,
        isArchived: false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        linkedCard: {
          select: {
            id: true,
            title: true,
          },
        },
        linkedFrom: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error("Error fetching context cards:", error);
    return NextResponse.json({ error: "Failed to fetch context cards" }, { status: 500 });
  }
}

// CREATE a new context card
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    // First, ensure the user exists in the database
    const user = await prisma.user.upsert({
      where: { id: token.sub },
      update: {},
      create: {
        id: token.sub,
        email: token.email,
        name: token.name,
        image: token.picture,
      },
    });

    const body = await req.json();
    const { 
      title, 
      content, 
      projectId, 
      type = "TASK", 
      visibility = "PRIVATE",
      attachments = [],
      slackLinks = [],
      issues,
      why,
      linkedCardId
    } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { createdById: token.sub },
          { 
            members: {
              some: {
                userId: token.sub,
                status: "ACTIVE"
              }
            }
          }
        ],
        isArchived: false,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // If linkedCardId is provided, verify it exists
    if (linkedCardId) {
      const linkedCard = await prisma.contextCard.findFirst({
        where: {
          id: linkedCardId,
          userId: token.sub,
        },
      });

      if (!linkedCard) {
        return NextResponse.json({ error: "Linked card not found" }, { status: 404 });
      }
    }

    const card = await prisma.contextCard.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        userId: token.sub,
        projectId,
        type,
        visibility,
        attachments,
        slackLinks,
        issues,
        why,
        linkedCardId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        linkedCard: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Update project's last activity
    await prisma.project.update({
      where: { id: projectId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ card });
  } catch (error) {
    console.error("Error creating context card:", error);
    return NextResponse.json({ error: "Failed to create context card" }, { status: 500 });
  }
}