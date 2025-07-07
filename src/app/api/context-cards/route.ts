
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@prisma/client";

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
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const projectId = formData.get("projectId") as string;
    const type = (formData.get("type") as string) || "TASK";
    const visibility = (formData.get("visibility") as string) || "PRIVATE";
    const why = formData.get("why") as string | null;
    const issues = formData.get("issues") as string | null;
    const mention = formData.get("mention") as string | null;
    const status = formData.get("status") as TaskStatus | null;


    // const tags = formData.getAll("tags").filter(Boolean) as string[];
    const attachments = formData.getAll("attachments") as File[];

    // Basic validation
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { createdById: token.sub },
          {
            members: {
              some: {
                userId: token.sub,
                status: "ACTIVE",
              },
            },
          },
        ],
        isArchived: false,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Store metadata (actual upload to Supabase/S3 will be added later)
    const savedCard = await prisma.contextCard.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        userId: token.sub,
        projectId,
        type: type as "TASK" | "INSIGHT" | "DECISION",
        ...(type === "TASK" && {
      status: status as TaskStatus,
    }),
        visibility: visibility as "PRIVATE" | "PUBLIC",
        why: why || undefined,
        issues: issues || undefined,
        slackLinks: mention ? [mention] : [],
        attachments: attachments.map((f) => f.name), // placeholder, file name only
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    (global as any).socketIOServer?.emit("new-context-card", savedCard);
    // Update project lastActivityAt
    await prisma.project.update({
      where: { id: projectId },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ card: savedCard });
  } catch (error) {
    console.error("Error creating context card:", error);
    return NextResponse.json({ error: "Failed to create context card" }, { status: 500 });
  }
}