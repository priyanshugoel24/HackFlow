import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First, ensure the user exists in the database
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
    
    // Verify user has access to this project
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
          }
        ],
      },
      select: { id: true, name: true, slug: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all context cards for analytics
    const cards = await prisma.contextCard.findMany({
      where: {
        projectId: project.id,
      },
      select: {
        id: true,
        type: true,
        status: true,
        visibility: true,
        createdAt: true,
        isArchived: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate analytics data
    const analytics = {
      // Card Type Distribution
      cardTypeDistribution: {
        TASK: cards.filter(card => card.type === 'TASK').length,
        INSIGHT: cards.filter(card => card.type === 'INSIGHT').length,
        DECISION: cards.filter(card => card.type === 'DECISION').length,
      },
      
      // Task Status Overview (only for TASK cards)
      taskStatusOverview: {
        ACTIVE: cards.filter(card => card.type === 'TASK' && card.status === 'ACTIVE').length,
        CLOSED: cards.filter(card => card.type === 'TASK' && card.status === 'CLOSED').length,
      },
      
      // Visibility Split
      visibilityDistribution: {
        PRIVATE: cards.filter(card => card.visibility === 'PRIVATE').length,
        PUBLIC: cards.filter(card => card.visibility === 'PUBLIC').length,
      },
      
      // Card Creation Over Time (grouped by week)
      cardCreationOverTime: generateTimeSeriesData(cards),
      
      // Additional stats
      totalCards: cards.length,
      archivedCards: cards.filter(card => card.isArchived).length,
      activeCards: cards.filter(card => !card.isArchived).length,
      
      // Top contributors
      topContributors: generateContributorsData(cards),
      
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
    };

    return NextResponse.json({ analytics });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

function generateTimeSeriesData(cards: any[]) {
  // Group cards by week
  const weeklyData = new Map<string, number>();
  
  cards.forEach(card => {
    const date = new Date(card.createdAt);
    // Get the start of the week (Monday)
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekKey = startOfWeek.toISOString().split('T')[0];
    weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + 1);
  });
  
  // Convert to array and sort by date
  return Array.from(weeklyData.entries())
    .map(([date, count]) => ({
      date,
      count,
      formattedDate: new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function generateContributorsData(cards: any[]) {
  const contributorMap = new Map<string, { name: string; email: string; count: number }>();
  
  cards.forEach(card => {
    if (card.user) {
      const key = card.user.id;
      const existing = contributorMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        contributorMap.set(key, {
          name: card.user.name || card.user.email,
          email: card.user.email,
          count: 1,
        });
      }
    }
  });
  
  return Array.from(contributorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 contributors
}
