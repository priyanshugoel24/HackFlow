import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAblyServer } from "@/lib/ably";

// PATCH: Update a project
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { name, link, description, tags, isArchived } = await req.json();

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
    const isCUID = /^c[a-z0-9]{24}$/i.test(id);
    
    // Ensure the user is the creator of the project (only creators can delete projects)
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
        createdById: user.id // Only creator can delete
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or permission denied" }, { status: 404 });
    }

    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id: project.id }, // Always use the actual ID for updates
      data: {
        ...(name && { name }),
        ...(link && { link }),
        ...(description !== undefined && { description }),
        ...(tags && { tags }),
        ...(isArchived !== undefined && { isArchived }),
        lastActivityAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    // Publish real-time update to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(`project:${project.id}`);
      
      await channel.publish("project:updated", {
        project: {
          ...updatedProject,
          createdAt: updatedProject.createdAt.toISOString(),
          lastActivityAt: updatedProject.lastActivityAt.toISOString(),
        },
        updatedBy: {
          id: user.id,
          name: token.name,
          email: token.email,
          image: token.picture,
        },
      });
    } catch (ablyError) {
      console.error("❌ Failed to publish to Ably:", ablyError);
      // Don't fail the entire request if Ably publish fails
    }

    return NextResponse.json({ 
      success: true, 
      project: {
        ...updatedProject,
        createdAt: updatedProject.createdAt.toISOString(),
        lastActivityAt: updatedProject.lastActivityAt.toISOString(),
      } 
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE: Delete a project
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if the id is a CUID (database ID) or a slug
    const isCUID = /^c[a-z0-9]{24}$/i.test(id);
    
    // First check if the project exists and user is the creator (only creators can delete)
    const existingProject = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
        createdById: token.sub,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Delete the project (this will cascade delete all related data)
    await prisma.project.delete({
      where: { id: existingProject.id }, // Always use the actual ID for deletes
    });

    return NextResponse.json({ 
      success: true, 
      message: "Project deleted successfully",
      deletedProject: existingProject 
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
