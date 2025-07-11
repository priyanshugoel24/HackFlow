import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { logActivity } from "@/lib/logActivity";
import { getAblyServer } from "@/lib/ably";
import { 
  contextCardSchema, 
  validateInput, 
  sanitizeText, 
  sanitizeHtml, 
  createRateLimiter 
} from "@/lib/security";

// Rate limiter: 60 requests per minute per user for updates (increased from 30)
const rateLimiter = createRateLimiter(60 * 1000, 60);

// PATCH: Update a context card
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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

  // Rate limiting
  if (!rateLimiter(user.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { id } = await params;
  const body = await req.json();
  console.log("📝 PATCH /api/context-cards/[id] - ID:", id);
  console.log("📝 PATCH body:", body);
  
  const { 
    title, 
    content, 
    isPinned, 
    projectId, 
    type, 
    visibility, 
    attachments, 
    slackLinks, 
    issues, 
    why, 
    linkedCardId, 
    isArchived,
    status,
    notifyUserId 
  } = body;

  // Sanitize and validate inputs
  const sanitizedData = {
    title: title ? sanitizeText(title) : undefined,
    content: content ? sanitizeHtml(content) : undefined,
    type: type || undefined,
    visibility: visibility || undefined,
    status: status || undefined,
    why: why ? sanitizeText(why) : undefined,
    issues: issues ? sanitizeText(issues) : undefined,
    projectId: projectId ? sanitizeText(projectId) : undefined
  };

  // Remove undefined values for partial validation
  const filteredData = Object.fromEntries(
    Object.entries(sanitizedData).filter(([, value]) => value !== undefined)
  );

  // Validate only the fields that are being updated
  if (Object.keys(filteredData).length > 0) {
    const validationResult = validateInput(contextCardSchema.partial(), filteredData);
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validationResult.errors 
      }, { status: 400 });
    }
  }

  try {
    // First check if the card exists and user has access to the project
    const existing = await prisma.contextCard.findFirst({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId: user.id,
                status: "ACTIVE"
              }
            }
          }
        }
      }
    });

    if (!existing) {
      console.log("❌ Card not found. ID:", id);
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if user has access to the project (either as creator or member)
    const hasProjectAccess = existing.project.createdById === user.id || existing.project.members.length > 0;
    
    if (!hasProjectAccess) {
      return NextResponse.json({ error: "Access denied. You must be a member of this project." }, { status: 403 });
    }

    // Determine if this is a content/structure edit vs a status/meta update
    const isContentEdit = title !== undefined || content !== undefined || isPinned !== undefined || 
                         projectId !== undefined || type !== undefined || visibility !== undefined || 
                         attachments !== undefined || slackLinks !== undefined || issues !== undefined || 
                         why !== undefined || linkedCardId !== undefined || isArchived !== undefined;
    
    // Only card creator can edit content/structure, but any project member can update status
    if (isContentEdit && existing.userId !== user.id) {
      console.log("❌ Only card creator can edit content. Card creator:", existing.userId, "Current user:", user.id);
      return NextResponse.json({ error: "Only the card creator can edit card content" }, { status: 403 });
    }

    console.log("✅ Found existing card:", existing.id, existing.title);

    // If projectId is being changed, verify new project exists and user has access
    if (projectId !== undefined && projectId !== existing.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { createdById: user.id },
            { 
              members: {
                some: {
                  userId: user.id,
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
    }

    // If linkedCardId is being changed, verify it exists
    if (linkedCardId !== undefined && linkedCardId !== existing.linkedCardId) {
      if (linkedCardId && linkedCardId !== id) { // Can't link to self
        const linkedCard = await prisma.contextCard.findFirst({
          where: {
            id: linkedCardId,
            userId: user.id,
          },
        });

        if (!linkedCard) {
          return NextResponse.json({ error: "Linked card not found" }, { status: 404 });
        }
      }
    }

    // Helper function to check if arrays are equal
    const arraysEqual = (a: unknown[], b: unknown[]) => {
      if (a === b) return true;
      if (!a || !b) return false;
      if (a.length !== b.length) return false;
      // Sort both arrays before comparing to handle order differences
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return JSON.stringify(sortedA) === JSON.stringify(sortedB);
    };

    // Helper function to check if values are equal (handles different types)
    const valuesEqual = (a: unknown, b: unknown) => {
      if (a === b) return true;
      if (a === null && b === undefined) return true;
      if (a === undefined && b === null) return true;
      if (Array.isArray(a) && Array.isArray(b)) {
        return arraysEqual(a, b);
      }
      // Handle null/undefined comparisons
      if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
      return JSON.stringify(a) === JSON.stringify(b);
    };

    // Check if any fields have actually changed with proper type handling
    const hasChanges = (
      (title !== undefined && title.trim() !== existing.title.trim()) ||
      (content !== undefined && content.trim() !== existing.content.trim()) ||
      (isPinned !== undefined && isPinned !== existing.isPinned) ||
      (projectId !== undefined && projectId !== existing.projectId) ||
      (type !== undefined && type !== existing.type) ||
      (visibility !== undefined && visibility !== existing.visibility) ||
      (attachments !== undefined && !valuesEqual(attachments, existing.attachments)) ||
      (slackLinks !== undefined && !valuesEqual(slackLinks, existing.slackLinks)) ||
      (issues !== undefined && (issues || '').trim() !== (existing.issues || '').trim()) ||
      (why !== undefined && (why || '').trim() !== (existing.why || '').trim()) ||
      (linkedCardId !== undefined && linkedCardId !== existing.linkedCardId) ||
      (isArchived !== undefined && isArchived !== existing.isArchived) ||
      (status !== undefined && status !== existing.status)
    );

    if (!hasChanges) {
      console.log("✅ No changes detected, returning existing card");
      return NextResponse.json({ card: existing });
    }

    console.log("📝 Applying updates to card");

    // Update the card with only the provided fields
    const updatedCard = await prisma.contextCard.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(isPinned !== undefined && { isPinned }),
        ...(projectId !== undefined && { projectId }),
        ...(type !== undefined && { type }),
        ...(visibility !== undefined && { visibility }),
        ...(attachments !== undefined && { attachments }),
        ...(slackLinks !== undefined && { slackLinks }),
        ...(issues !== undefined && { issues }),
        ...(why !== undefined && { why }),
        ...(linkedCardId !== undefined && { linkedCardId }),
        ...(isArchived !== undefined && { isArchived }),
        ...(status !== undefined && { status: status as TaskStatus }),
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
    });

    // Update project's last activity if project-related fields changed
    if (projectId !== undefined || title !== undefined || content !== undefined) {
      await prisma.project.update({
        where: { id: updatedCard.projectId },
        data: { lastActivityAt: new Date() },
      });
      (global as { io?: { emit: (event: string, data: unknown) => void } }).io?.emit("card:update", updatedCard);
    }

    // Log the activity
    await logActivity({
      type: "CARD_UPDATED",
      description: `Updated card "${updatedCard.title}"`,
      metadata: { cardId: updatedCard.id },
      userId: user.id,
      projectId: updatedCard.projectId,
    });

    // Send notification if a user was mentioned
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
            description: `mentioned ${mentionedUser.name || 'a team member'} in "${updatedCard.title}"`,
            metadata: { 
              cardId: updatedCard.id,
              mentionedUserId: mentionedUser.id,
              mentionedUserName: mentionedUser.name
            },
            userId: user.id,
            projectId: updatedCard.projectId,
          });

          // Send real-time notification via Ably if available
          try {
            const ably = getAblyServer();
            if (ably) {
              // Send notification to the project channel
              const projectChannel = ably.channels.get(`project:${updatedCard.projectId}`);
              await projectChannel.publish("activity:created", {
                id: `activity_${Date.now()}`,
                type: "USER_MENTIONED",
                description: `mentioned ${mentionedUser.name || 'a team member'} in "${updatedCard.title}"`,
                createdAt: new Date().toISOString(),
                userId: user.id,
                projectId: updatedCard.projectId,
                metadata: { 
                  cardId: updatedCard.id,
                  mentionedUserId: mentionedUser.id
                }
              });
              
              // Send a direct notification to the mentioned user
              const userChannel = ably.channels.get(`user:${mentionedUser.id}`);
              await userChannel.publish("notification", {
                id: `notification_${Date.now()}`,
                type: "MENTION",
                message: `You were mentioned in "${updatedCard.title}"`,
                createdAt: new Date().toISOString(),
                metadata: {
                  cardId: updatedCard.id,
                  projectId: updatedCard.projectId,
                  mentionedBy: user.id
                }
              });
            }
          } catch (ablyError) {
            console.error("Failed to send Ably notification:", ablyError);
          }
        }
      } catch (mentionError) {
        console.error("Error processing mention notification:", mentionError);
      }
    }

    return NextResponse.json({ card: updatedCard });
  } catch (error) {
    console.error("PATCH error:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

// DELETE: Remove a context card
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
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

    // First check if the card exists and belongs to the user
    const existing = await prisma.contextCard.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Card not found or not yours" }, { status: 404 });
    }

    // Delete the card
    await prisma.contextCard.delete({
      where: { id },
    });
    (global as { socketIOServer?: { emit: (event: string, data: unknown) => void } }).socketIOServer?.emit("card:delete", existing);

    // Log the activity
    await logActivity({
    type: "CARD_DELETED",
    description: `Deleted card "${existing.title}"`,
    metadata: { cardId: existing.id },
    userId: user.id,
    projectId: existing.projectId,
  });

    return NextResponse.json({ 
      success: true, 
      message: "Card deleted successfully",
      deletedCard: existing 
    });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}