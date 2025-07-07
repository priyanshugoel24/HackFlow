import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// GET: Get a single project with its context cards
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if the id is a UUID (legacy ID) or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    const project = await prisma.project.findFirst({
      where: {
        ...(isUUID ? { id } : { slug: id }),
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
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        contextCards: {
          where: { isArchived: false },
          orderBy: { updatedAt: "desc" },
          include: {
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
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PATCH: Update a project
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { name, link, description, tags, isArchived } = await req.json();

  try {
    // Check if the id is a UUID (legacy ID) or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // First check if the project exists and user has permission to edit
    const existingProject = await prisma.project.findFirst({
      where: {
        ...(isUUID ? { id } : { slug: id }),
        OR: [
          { createdById: token.sub },
          { 
            members: {
              some: {
                userId: token.sub,
                role: "MANAGER",
                status: "ACTIVE"
              }
            }
          }
        ],
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Update the project and return the updated data
    const updatedProject = await prisma.project.update({
      where: { id: existingProject.id }, // Always use the actual ID for updates
      data: {
        ...(name !== undefined && { name }),
        ...(link !== undefined && { link }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(isArchived !== undefined && { isArchived }),
        lastActivityAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    return NextResponse.json({ 
      success: true, 
      project: updatedProject 
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
    // Check if the id is a UUID (legacy ID) or a slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // First check if the project exists and user is the creator (only creators can delete)
    const existingProject = await prisma.project.findFirst({
      where: {
        ...(isUUID ? { id } : { slug: id }),
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