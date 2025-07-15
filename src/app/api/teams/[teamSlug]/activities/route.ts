import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Find the team by slug
    const team = await prisma.team.findFirst({
      where: {
        slug,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
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
