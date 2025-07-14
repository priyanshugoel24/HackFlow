import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const resolvedParams = await params;
    const team = await prisma.team.findUnique({
      where: { slug: resolvedParams.teamSlug },
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
        projects: {
          include: {
            contextCards: {
              where: {
                isArchived: false,
              },
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
          where: { isArchived: false },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is a team member
    const userMembership = team.members.find(member => member.userId === user.id);
    if (!userMembership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate analytics
    const totalProjects = team.projects.length;
    const activeMembers = team.members.length;
    let totalTasks = 0;
    let completedTasks = 0;
    let activeTasks = 0;
    
    // All context cards across team projects
    const allCards = team.projects.flatMap(project => project.contextCards);
    const totalCards = allCards.length;
    
    // Card type distribution
    const cardTypeDistribution = allCards.reduce((acc, card) => {
      acc[card.type] = (acc[card.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate velocity data (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    const weeklyVelocity = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      
      const completedThisWeek = allCards.filter(card => 
        card.status === 'CLOSED' && 
        card.updatedAt >= weekStart && 
        card.updatedAt <= weekEnd
      ).length;
      
      weeklyVelocity.push({
        week: weekLabel,
        completed: completedThisWeek,
      });
    }

    // Top contributors (by cards created)
    const contributorStats = allCards.reduce((acc, card) => {
      if (card.user) {
        const userId = card.user.id;
        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName: card.user.name || card.user.email,
            cardsCreated: 0,
            cardsCompleted: 0,
          };
        }
        acc[userId].cardsCreated++;
        if (card.status === 'CLOSED') {
          acc[userId].cardsCompleted++;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    const topContributors = Object.values(contributorStats)
      .sort((a: any, b: any) => b.cardsCreated - a.cardsCreated)
      .slice(0, 10);

    // Calculate project progress
    const projectProgress = team.projects.map(project => {
      const projectTasks = project.contextCards.filter(card => card.type === 'TASK');
      const projectCompletedTasks = projectTasks.filter(card => card.status === 'CLOSED');
      const projectActiveTasks = projectTasks.filter(card => card.status !== 'CLOSED');

      totalTasks += projectTasks.length;
      completedTasks += projectCompletedTasks.length;
      activeTasks += projectActiveTasks.length;

      const progress = projectTasks.length > 0 ? Math.round((projectCompletedTasks.length / projectTasks.length) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        totalTasks: projectTasks.length,
        completedTasks: projectCompletedTasks.length,
        progress,
      };
    });

    // Average time to complete (for closed tasks)
    const closedTasks = allCards.filter(card => card.type === 'TASK' && card.status === 'CLOSED');
    let avgTimeToComplete = 0;
    if (closedTasks.length > 0) {
      const totalTime = closedTasks.reduce((acc, task) => {
        const timeDiff = task.updatedAt.getTime() - task.createdAt.getTime();
        return acc + timeDiff;
      }, 0);
      avgTimeToComplete = Math.round(totalTime / closedTasks.length / (1000 * 60 * 60 * 24)); // Convert to days
    }

    const completedProjects = projectProgress.filter(p => p.totalTasks > 0 && p.completedTasks === p.totalTasks).length;
    const activeProjects = totalProjects - completedProjects;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const analytics = {
      // Overview stats
      totalProjects,
      completedProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      activeTasks,
      totalCards,
      activeMembers,
      taskCompletionRate,
      avgTimeToComplete,
      
      // Chart data
      projectProgress: projectProgress.sort((a, b) => b.progress - a.progress),
      weeklyVelocity,
      cardTypeDistribution: Object.entries(cardTypeDistribution).map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / totalCards) * 100),
      })),
      topContributors,
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching team analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
