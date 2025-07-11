import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

// PATCH: Archive/Unarchive a context card (only by project creator, managers, or card creator)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { isArchived } = await req.json();

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

    // First check if the card exists and get project info
    const card = await prisma.contextCard.findFirst({
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

    if (!card) {
      return NextResponse.json({ error: "Context card not found" }, { status: 404 });
    }

    // Check if user has permission to archive this card
    const isCardCreator = card.userId === user.id;
    const isProjectCreator = card.project.createdById === user.id;
    const isManager = card.project.members.some(member => 
      member.userId === user.id && member.role === "MANAGER"
    );

    if (!isCardCreator && !isProjectCreator && !isManager) {
      return NextResponse.json({ 
        error: "Access denied. Only card creators, project creators, and managers can archive cards." 
      }, { status: 403 });
    }

    // Update the card's archive status
    const updatedCard = await prisma.contextCard.update({
      where: { id },
      data: { 
        isArchived,
        updatedAt: new Date()
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

    // Update project's last activity
    await prisma.project.update({
      where: { id: card.projectId },
      data: { lastActivityAt: new Date() },
    });

    // Log the activity
    await logActivity({
      type: isArchived ? "CARD_ARCHIVED" : "CARD_UNARCHIVED",
      description: `${isArchived ? 'Archived' : 'Unarchived'} card "${card.title}"`,
      metadata: { cardId: card.id },
      userId: user.id,
      projectId: card.projectId,
    });

    return NextResponse.json({ 
      success: true, 
      card: updatedCard,
      message: `Context card ${isArchived ? 'archived' : 'unarchived'} successfully`
    });
  } catch (error) {
    console.error("Error archiving/unarchiving context card:", error);
    return NextResponse.json({ error: "Failed to update card archive status" }, { status: 500 });
  }
}
