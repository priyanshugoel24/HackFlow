import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAblyServer } from "@/lib/ably";

// POST /api/projects/[id]/decline-invite
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    console.log(`🔍 User ${token.sub} (${token.email}) attempting to decline invite for project: ${id}`);
    
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
            userId: token.sub,
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
      console.log(`❌ No invitation found for user ${token.sub} (${token.email}) in project ${project.id}`);
      return NextResponse.json({ error: "No invitation found for this project" }, { status: 404 });
    }

    console.log(`📨 Found invitation: ${existingMember.id}, status: ${existingMember.status}, for user: ${existingMember.userId}`);

    if (existingMember.status !== "INVITED") {
      return NextResponse.json({ error: "No pending invitation to decline" }, { status: 400 });
    }

    // Decline the invitation by deleting the membership record
    console.log(`🗑️ Declining invitation for user ${existingMember.userId}`);
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          projectId: project.id,
          userId: existingMember.userId,
        },
      },
    });

    // Update project activity
    await prisma.project.update({
      where: { id: project.id },
      data: { lastActivityAt: new Date() },
    });

    // Publish real-time update to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(`project:${project.id}`);
      
      await channel.publish("member:declined", {
        userId: token.sub,
        projectId: project.id,
      });
      
      console.log("📡 Published member:declined event to Ably for project:", project.id);
    } catch (ablyError) {
      console.error("❌ Failed to publish to Ably:", ablyError);
      // Don't fail the entire request if Ably publish fails
    }

    console.log(`✅ User ${token.sub} declined invitation to project ${project.id}`);

    return NextResponse.json({ 
      success: true, 
      message: "Invitation declined successfully"
    });
  } catch (error) {
    console.error("Error declining invitation:", error);
    return NextResponse.json({ error: "Failed to decline invitation" }, { status: 500 });
  }
}
