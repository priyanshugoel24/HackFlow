import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Session } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  const { teamSlug } = await params;

  try {
    // Check authentication
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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

    // Get all activities for projects that belong to this team
    const activities = await prisma.activity.findMany({
      where: { 
        project: {
          teamId: team.id,
          isArchived: false,
        }
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        project: {
          select: { id: true, name: true, slug: true },
        },
      },
      take: 100, // Show more activities for team view
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching team activities:", error);
    return NextResponse.json({ error: "Failed to fetch team activities" }, { status: 500 });
  }
}
