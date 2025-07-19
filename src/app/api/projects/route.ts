import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { generateSlug, generateUniqueSlug } from "@/lib/utils";
import { logActivity } from "@/lib/logActivity";
import { getAblyServer } from "@/lib/ably";
import { 
  createRateLimiter 
} from "@/lib/security";

// Rate limiter: 60 requests per minute per user for project operations (increased from 10)
const rateLimiter = createRateLimiter(60 * 1000, 60);

// CREATE new project
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { name, link, description, tags, teamId } = await req.json();

  if (!name)
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });

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

    // If teamId is provided, verify user has permission to create projects in this team
    if (teamId) {
      const teamMembership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: user.id,
            teamId: teamId,
          },
        },
      });

      if (!teamMembership || teamMembership.status !== 'ACTIVE') {
        return NextResponse.json({ error: "Access denied to this team" }, { status: 403 });
      }

      // Only allow certain roles to create projects
      if (!['OWNER', 'MEMBER'].includes(teamMembership.role)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }
    }

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
        createdById: user.id,
        teamId: teamId || null, // Assign to team if provided
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Log activity
    await logActivity({
      type: "PROJECT_CREATED",
      description: `created project "${name}"`,
      userId: user.id,
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
          id: user.id,
          name: user.name,
          image: user.image,
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