import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAblyServer } from "@/lib/ably";
import { logActivity } from "@/lib/logActivity";

// POST /api/projects/[id]/accept-invite
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    console.log(`🔍 User ${user.id} (${token.email}) attempting to accept invite for project: ${id}`);
    
    // Check if the id is a CUID (database ID) or a slug
    const isCUID = /^c[a-z0-9]{24}$/.test(id);
    
    // Find the project
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
        isArchived: false,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has a pending invitation (by user ID or email)
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        OR: [
          {
            userId: user.id,
            projectId: project.id,
          },
          {
            user: {
              email: token.email,
            },
            projectId: project.id,
          },
        ],
      },
      include: {
        user: true,
      },
    });

    if (!existingMember) {
      console.log(`❌ No invitation found for user ${user.id} (${token.email}) in project ${project.id}`);
      return NextResponse.json({ error: "No invitation found for this project" }, { status: 404 });
    }

    console.log(`📨 Found invitation: ${existingMember.id}, status: ${existingMember.status}, for user: ${existingMember.userId}`);

    if (existingMember.status === "ACTIVE") {
      return NextResponse.json({ error: "You are already a member of this project" }, { status: 400 });
    }

    if (existingMember.status !== "INVITED") {
      return NextResponse.json({ error: "Invalid invitation status" }, { status: 400 });
    }

    // Accept the invitation by updating status to ACTIVE
    let updatedMember;
    
    if (existingMember.userId === user.id) {
      // Direct match - just update the status
      console.log(`✅ Direct user match - updating membership status to ACTIVE`);
      updatedMember = await prisma.projectMember.update({
        where: {
          userId_projectId: {
            projectId: project.id,
            userId: user.id,
          },
        },
        data: {
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } else {
      // Email match - need to transfer the invitation to the current user
      console.log(`🔄 Email match - transferring invitation from placeholder user ${existingMember.userId} to current user ${user.id}`);
      // First, delete the old placeholder invitation
      await prisma.projectMember.delete({
        where: {
          userId_projectId: {
            projectId: project.id,
            userId: existingMember.userId,
          },
        },
      });
      
      // Create a new membership for the current authenticated user
      updatedMember = await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: existingMember.role,
          status: "ACTIVE",
          addedById: existingMember.addedById,
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    // Update project activity
    await prisma.project.update({
      where: { id: project.id },
      data: { lastActivityAt: new Date() },
    });

    // Log activity for member joining
    await logActivity({
      type: "MEMBER_JOINED",
      description: `joined the project`,
      userId: user.id,
      projectId: project.id,
      metadata: { 
        memberId: updatedMember.id,
        role: updatedMember.role 
      },
    });

    // Publish real-time update to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(`project:${project.id}`);
      
      await channel.publish("member:accepted", {
        id: updatedMember.id,
        userId: updatedMember.userId,
        projectId: updatedMember.projectId,
        role: updatedMember.role,
        status: updatedMember.status,
        joinedAt: updatedMember.joinedAt,
        user: updatedMember.user
      });

      // Also publish to activity feed
      await channel.publish("activity:created", {
        id: `activity_${Date.now()}`,
        type: "MEMBER_JOINED",
        description: `joined the project`,
        createdAt: new Date().toISOString(),
        userId: user.id,
        projectId: project.id,
        user: {
          id: user.id,
          name: token.name,
          image: token.picture,
        },
        metadata: { 
          memberId: updatedMember.id,
          role: updatedMember.role 
        },
      });
      
      console.log("📡 Published member:accepted and activity:created events to Ably for project:", project.id);
    } catch (ablyError) {
      console.error("❌ Failed to publish to Ably:", ablyError);
      // Don't fail the entire request if Ably publish fails
    }

    console.log(`✅ User ${user.id} accepted invitation to project ${project.id}`);

    return NextResponse.json({ 
      success: true, 
      message: "Invitation accepted successfully",
      member: updatedMember 
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
