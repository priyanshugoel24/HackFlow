import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { logActivity } from "@/lib/logActivity";
import { getAblyServer } from "@/lib/ably";

// GET all projects for the user (including where they're a member)
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    console.log(`🔍 Fetching projects for user: ${token.sub} (${token.email})`);
    
    // First, ensure the user exists in the database
    const user = await prisma.user.upsert({
      where: { id: token.sub },
      update: {},
      create: {
        id: token.sub,
        email: token.email,
        name: token.name,
        image: token.picture,
      },
    });

    const projects = await prisma.project.findMany({
      where: {
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
        ]
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        _count: {
          select: {
            contextCards: true
          }
        }
      },
      orderBy: { lastActivityAt: "desc" },
    });

    console.log(`📋 Found ${projects.length} projects for user ${token.sub}`);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// CREATE new project
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { name, link, description, tags } = await req.json();

  if (!name)
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });

  try {
    // First, ensure the user exists in the database
    const user = await prisma.user.upsert({
      where: { id: token.sub },
      update: {},
      create: {
        id: token.sub,
        email: token.email,
        name: token.name,
        image: token.picture,
      },
    });

    // Generate a unique slug for the project
    const baseSlug = generateSlug(name);
    const existingProjects = await prisma.project.findMany({
      select: { slug: true }
    });
    const existingSlugs = existingProjects.map(p => p.slug);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    const project = await prisma.project.create({
      data: {
        name,
        slug: uniqueSlug,
        link: link?.startsWith("http") ? link : `https://${link}`,
        description,
        tags: tags || [],
        createdById: token.sub,
        members: {
          create: {
            userId: token.sub,
            role: "MANAGER",
            status: "ACTIVE"
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Log activity
    await logActivity({
      type: "PROJECT_CREATED",
      description: `created project "${name}"`,
      userId: token.sub,
      projectId: project.id,
      metadata: { projectName: name, projectSlug: uniqueSlug },
    });

    // Publish to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(`project:${project.id}`);
      await channel.publish("activity:created", {
        id: Date.now(), // temporary ID for real-time display
        type: "PROJECT_CREATED",
        description: `created project "${name}"`,
        user: {
          id: token.sub,
          name: token.name,
          image: token.picture,
        },
        createdAt: new Date().toISOString(),
        projectId: project.id,
        metadata: { projectName: name, projectSlug: uniqueSlug },
      });
    } catch (error) {
      console.error("Failed to publish project creation activity to Ably:", error);
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}