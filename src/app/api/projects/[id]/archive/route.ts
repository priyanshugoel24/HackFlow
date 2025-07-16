import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { getAblyServer } from "@/lib/ably";

// PATCH: Archive/Unarchive a project (only by project creator or managers)
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

    // Check if the id is a CUID (database ID) or a slug
    const isCUID = /^c[a-z0-9]{24}$/.test(id);
    
    // First check if the project exists and user has permission to archive
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
      },
      include: {
        members: {
          where: {
            userId: user.id,
            status: "ACTIVE"
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is project creator or a manager
    const isProjectCreator = project.createdById === user.id;
    const isManager = project.members.some(member => 
      member.userId === user.id && member.role === "MANAGER"
    );

    if (!isProjectCreator && !isManager) {
      return NextResponse.json({ 
        error: "Access denied. Only project creators and managers can archive projects." 
      }, { status: 403 });
    }

    // Update the project's archive status
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: { 
        isArchived,
        lastActivityAt: new Date()
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Log the activity
    await logActivity({
      type: isArchived ? "PROJECT_ARCHIVED" : "PROJECT_UNARCHIVED",
      description: `${isArchived ? 'Archived' : 'Unarchived'} project "${project.name}"`,
      metadata: { projectId: project.id },
      userId: user.id,
      projectId: project.id,
    });

    // Publish real-time update to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(`project:${project.id}`);
      
      await channel.publish("project:archive_status_changed", {
        projectId: project.id,
        isArchived,
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`📡 Published project:archive_status_changed event to Ably for project: ${project.id}`);
    } catch (ablyError) {
      console.error("❌ Failed to publish to Ably:", ablyError);
      // Don't fail the entire request if Ably publish fails
    }

    return NextResponse.json({ 
      success: true, 
      project: updatedProject,
      message: `Project ${isArchived ? 'archived' : 'unarchived'} successfully`
    });
  } catch (error) {
    console.error("Error archiving/unarchiving project:", error);
    return NextResponse.json({ error: "Failed to update project archive status" }, { status: 500 });
  }
}
