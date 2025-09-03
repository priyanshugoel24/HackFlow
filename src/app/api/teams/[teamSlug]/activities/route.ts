import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  const { teamSlug } = await params;

  try {
    // Check authentication and get user
    const user = await getAuthenticatedUser(req);

    // Find the team by slug
    const team = await prisma.team.findFirst({
      where: {
        slug: teamSlug,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user has access to this team
    const membership = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        teamId: team.id,
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all activities for this team (both project-level and team-level)
    const activities = await prisma.activity.findMany({
      where: { 
        OR: [
          {
            project: {
              teamId: team.id,
              isArchived: false,
            }
          },
          {
            teamId: team.id
          }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        project: {
          select: { id: true, name: true, slug: true },
        },
        team: {
          select: { id: true, name: true, slug: true },
        },
      },
      take: 100, // Show more activities for team view
    });

    return NextResponse.json({ activities });
  } catch (error) {
    if (error instanceof Error && error.message === 'No authenticated user found') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching team activities:", error);
    return NextResponse.json({ error: "Failed to fetch team activities" }, { status: 500 });
  }
}
