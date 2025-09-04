import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectSlug: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { projectSlug } = await params;

    // Check if the projectSlug is a CUID (database ID) or a slug
    const isCUID = /^c[a-z0-9]{24}$/i.test(projectSlug);

    // Find the project and ensure user has access
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id: projectSlug } : { slug: projectSlug }),
        OR: [
          { createdById: user.id },
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
        isArchived: false,
      },
      include: {
        team: {
          include: {
            members: {
              where: { status: 'ACTIVE' },
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
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Return team members if project has a team, otherwise empty array
    const members = project.team?.members || [];
    
    return NextResponse.json(members);
  } catch (error) {
    if (error instanceof Error && error.message === 'No authenticated user found') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching project team members:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
