import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { TaskStatus, Prisma } from "@prisma/client";
import { logActivity } from "@/lib/logActivity";
import { getAblyServer } from "@/lib/ably";
import { 
  contextCardSchema, 
  validateInput, 
  sanitizeText, 
  sanitizeHtml, 
  createRateLimiter,
  validateFileUpload 
} from "@/lib/security";

// Rate limiter: 20 requests per minute per user
const rateLimiter = createRateLimiter(60 * 1000, 20);

// GET all context cards for logged-in user
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Query params
  const { searchParams } = new URL(req.url);
  const assignedTo = searchParams.get("assignedTo");
  const status = searchParams.get("status");
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50); // max 50 per page

  try {
    // First, ensure the user exists in the database
    await prisma.user.upsert({
      where: { id: token.sub },
      update: {},
      create: {
        id: token.sub,
        email: token.email,
        name: token.name,
        image: token.picture,
      },
    });

    // Build query for assigned cards
    let where: Prisma.ContextCardWhereInput = { isArchived: false };

    // If assignedTo is provided, fetch cards where the user is assigned OR created by them
    if (assignedTo) {
      where = {
        ...where,
        OR: [
          { assignedToId: assignedTo } as any, // Type assertion for assignedToId
          { userId: assignedTo }
        ],
      };
    } else {
      // Default: show cards created by the user
      where = { ...where, userId: token.sub };
    }
    if (status) {
      where = { ...where, status: status as TaskStatus };
    }

    const cards = await prisma.contextCard.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, image: true } }, // Fetch creator
        linkedCard: { select: { id: true, title: true } },
        linkedFrom: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: offset,
      take: limit,
    });

    // Manually fetch assigned user information for each card
    const cardsWithAssignedUser = await Promise.all(
      cards.map(async (card) => {
        const cardWithId = card as any; // Type assertion to access assignedToId
        if (cardWithId.assignedToId) {
          const assignedUser = await prisma.user.findUnique({
            where: { id: cardWithId.assignedToId },
            select: { id: true, name: true, image: true },
          });
          return { ...card, assignedTo: assignedUser };
        }
        return { ...card, assignedTo: null };
      })
    );

    return NextResponse.json({ cards: cardsWithAssignedUser });
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

  // Rate limiting
  if (!rateLimiter(token.sub)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const projectIdentifier = formData.get("projectId") as string; // Could be ID or slug
    const type = (formData.get("type") as string) || "TASK";
    const visibility = (formData.get("visibility") as string) || "PRIVATE";
    const why = formData.get("why") as string | null;
    const issues = formData.get("issues") as string | null;
    const mention = formData.get("mention") as string | null;
    const status = formData.get("status") as TaskStatus | null;
    const notifyUserId = formData.get("notifyUserId") as string | null;

    const attachments = formData.getAll("attachments") as File[];

    // Validate input using security schema
    const validationResult = validateInput(contextCardSchema, {
      title: sanitizeText(title),
      content: sanitizeHtml(content),
      type,
      visibility,
      status: status || "ACTIVE",
      why: why ? sanitizeText(why) : undefined,
      issues: issues ? sanitizeText(issues) : undefined,
      mention: mention ? sanitizeText(mention) : undefined,
      projectId: sanitizeText(projectIdentifier)
    });

    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validationResult.errors 
      }, { status: 400 });
    }

    // Validate file uploads
    for (const file of attachments) {
      const fileValidation = validateFileUpload(file);
      if (!fileValidation.isValid) {
        return NextResponse.json({ 
          error: `File validation failed: ${fileValidation.error}` 
        }, { status: 400 });
      }
    }

    // Check if the identifier is a UUID (legacy ID) or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectIdentifier);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        ...(isUUID ? { id: projectIdentifier } : { slug: projectIdentifier }),
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
        projectId: project.id, // Use the actual project ID from the database
        type: type as "TASK" | "INSIGHT" | "DECISION",
        ...(type === "TASK" && {
      status: status as TaskStatus,
    }),
        visibility: visibility as "PRIVATE" | "PUBLIC",
        why: why || undefined,
        issues: issues || undefined,
        slackLinks: mention ? [mention] : [],
        attachments: attachments.map((f) => f.name), // placeholder, file name only
        ...(notifyUserId && {
          assignedToId: notifyUserId
        }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await logActivity({
      type: "CARD_CREATED",
      description: `created a new ${type.toLowerCase()} "${title.trim()}"`,
      userId: token.sub,
      projectId: project.id,
      metadata: {
        cardId: savedCard.id,
        cardType: type,
      },
    });

    // Publish real-time update to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(`project:${project.id}`);
      
      await channel.publish("activity:created", {
        id: `activity_${Date.now()}`,
        type: "CARD_CREATED",
        description: `created a new ${type.toLowerCase()} "${title.trim()}"`,
        createdAt: new Date().toISOString(),
        userId: token.sub,
        projectId: project.id,
        user: {
          id: token.sub,
          name: token.name,
          image: token.picture,
        },
      });
      
      console.log("📡 Published activity:created event to Ably for project:", project.id);
      
      // Handle notification for mentioned user
      if (notifyUserId) {
        try {
          // Find the mentioned user
          const mentionedUser = await prisma.user.findUnique({
            where: { id: notifyUserId },
            select: { id: true, name: true, email: true }
          });

          if (mentionedUser) {
            // Log a specific mention activity
            await logActivity({
              type: "USER_MENTIONED",
              description: `mentioned ${mentionedUser.name || 'a team member'} in "${title.trim()}"`,
              metadata: { 
                cardId: savedCard.id,
                mentionedUserId: mentionedUser.id,
                mentionedUserName: mentionedUser.name
              },
              userId: token.sub,
              projectId: project.id,
            });

            // Send a direct notification to the mentioned user
            const userChannel = ably.channels.get(`user:${mentionedUser.id}`);
            await userChannel.publish("notification", {
              id: `notification_${Date.now()}`,
              type: "MENTION",
              message: `You were mentioned in a new card "${title.trim()}"`,
              createdAt: new Date().toISOString(),
              metadata: {
                cardId: savedCard.id,
                projectId: project.id,
                mentionedBy: token.sub
              }
            });
          }
        } catch (mentionError) {
          console.error("Error processing mention notification:", mentionError);
        }
      }
    } catch (ablyError) {
      console.error("❌ Failed to publish activity to Ably:", ablyError);
    }

    // Update project lastActivityAt
    await prisma.project.update({
      where: { id: project.id },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ card: savedCard });
  } catch (error) {
    console.error("Error creating context card:", error);
    return NextResponse.json({ error: "Failed to create context card" }, { status: 500 });
  }
}