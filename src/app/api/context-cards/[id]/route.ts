import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

// PATCH: Update a context card
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
    status 
  } = body;

  try {
    // First check if the card exists and belongs to the user
    const existing = await prisma.contextCard.findFirst({
      where: {
        id,
        userId: token.sub,
      },
    });

    if (!existing) {
      console.log("❌ Card not found or not owned by user. ID:", id, "User:", token.sub);
      return NextResponse.json({ error: "Card not found or not owned by user" }, { status: 404 });
    }

    console.log("✅ Found existing card:", existing.id, existing.title);

    // If projectId is being changed, verify new project exists and user has access
    if (projectId !== undefined && projectId !== existing.projectId) {
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
    }

    // If linkedCardId is being changed, verify it exists
    if (linkedCardId !== undefined && linkedCardId !== existing.linkedCardId) {
      if (linkedCardId && linkedCardId !== id) { // Can't link to self
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
    }

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
      (global as any).io?.emit("card:update", updatedCard);
    }

    console.log("📊 Update successful. Card:", updatedCard.id);
    return NextResponse.json({ success: true, card: updatedCard });
  } catch (error) {
    console.error("❌ PATCH error:", error);
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
    // First check if the card exists and belongs to the user
    const existing = await prisma.contextCard.findFirst({
      where: {
        id,
        userId: token.sub,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Card not found or not yours" }, { status: 404 });
    }

    // Delete the card
    await prisma.contextCard.delete({
      where: { id },
    });
    (global as any).socketIOServer?.emit("card:delete", existing);

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