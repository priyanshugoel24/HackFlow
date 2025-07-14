import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAblyServer } from "@/lib/ably";

// GET: Get a single project with its context cards
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  
  // Check if we should include archived cards
  const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";

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
    
    console.log(`🔍 GET /api/projects/${id} - User: ${user.id} (${user.email}), isCUID: ${isCUID}, includeArchived: ${includeArchived}`);
    
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
        OR: [
          { createdById: user.id },
          { 
            members: {
              some: {
                userId: user.id,
                status: "ACTIVE"
              }
            }
          },
          // Team-based access: if user is an active team member and project belongs to that team
          {
            team: {
              members: {
                some: {
                  userId: user.id,
                  status: "ACTIVE"
                }
              }
            }
          }
        ],
        // Include archived projects only if explicitly requested
        ...(includeArchived ? {} : { isArchived: false }),
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
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            members: {
              where: { status: "ACTIVE" },
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
          },
        },
        contextCards: {
          where: includeArchived ? {} : { isArchived: false },
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
      console.error(`❌ Project not found or access denied for ${id}`);
      console.error(`   - User ID: ${user.id}, Email: ${user.email}`);
      
      // Debug: Let's try to find the project without access restrictions
      const debugProject = await prisma.project.findFirst({
        where: {
          ...(isCUID ? { id } : { slug: id }),
          isArchived: false,
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true }
              }
            }
          }
        }
      });
      
      if (debugProject) {
        console.error(`   - Project exists: ${debugProject.name} (${debugProject.id})`);
        console.error(`   - Project creator: ${debugProject.createdById}`);
        console.error(`   - Project members:`, debugProject.members.map(m => ({
          userId: m.userId,
          email: m.user.email,
          status: m.status,
          role: m.role
        })));
        console.error(`   - User should have access: ${debugProject.createdById === user.id || debugProject.members.some(m => m.userId === user.id && m.status === 'ACTIVE')}`);
      } else {
        console.error(`   - Project does not exist with identifier: ${id}`);
      }
      
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    console.log(`✅ Project found: ${project.name} (${project.id}) for user ${user.id}`);

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
    
    // First check if the project exists and user has permission to edit
    const existingProject = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
        OR: [
          { createdById: user.id },
          { 
            members: {
              some: {
                userId: user.id,
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

        await getAblyServer().channels.get(`project:${existingProject.id}`).publish("project:updated", {
      id: existingProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      updatedAt: updatedProject.lastActivityAt,
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
