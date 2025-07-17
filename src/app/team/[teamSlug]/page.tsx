import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import TeamPageClient from '@/components/TeamPageClient';
import { TeamPageTeam } from '@/interfaces/TeamPageTeam';
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

interface TeamPageProps {
  params: Promise<{ teamSlug: string }>;
}

// Server-side data fetching
async function fetchTeam(teamSlug: string): Promise<TeamPageTeam | null> {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return null;
    }

    // First, ensure the user exists in the database and get the actual user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {
        name: session.user.name,
        image: session.user.image,
      },
      create: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    });

    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      include: {
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
          where: { status: 'ACTIVE' },
        },
        projects: {
          include: {
            _count: {
              select: {
                contextCards: {
                  where: {
                    type: 'TASK',
                    isArchived: false,
                  },
                },
              },
            },
          },
          where: { isArchived: false },
        },
        _count: {
          select: {
            members: {
              where: { status: 'ACTIVE' }
            },
            projects: true,
          },
        },
      },
    });

    if (!team) {
      return null;
    }

    // Check if user is a member of this team
    const userMembership = team.members.find(
      (member) => member.user.id === user.id
    );

    if (!userMembership) {
      return null;
    }

    // Calculate task completion stats for each project
    const projectsWithStats = await Promise.all(
      team.projects.map(async (project) => {
        const taskStats = await prisma.contextCard.aggregate({
          where: {
            projectId: project.id,
            type: 'TASK',
            isArchived: false,
          },
          _count: {
            id: true,
          },
        });

        const completedTaskStats = await prisma.contextCard.aggregate({
          where: {
            projectId: project.id,
            type: 'TASK',
            status: 'CLOSED',
            isArchived: false,
          },
          _count: {
            id: true,
          },
        });

        const totalTasks = taskStats._count.id;
        const completedTasks = completedTaskStats._count.id;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          ...project,
          createdAt: project.createdAt.toISOString(),
          lastActivityAt: project.lastActivityAt.toISOString(),
          stats: {
            totalTasks,
            completedTasks,
            progress: Math.round(progress),
          },
        };
      })
    );

    // Fetch team activities
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

    return {
      ...team,
      projects: projectsWithStats,
      userRole: userMembership.role,
      currentUserId: user.id,
      hackathonDeadline: team.hackathonDeadline?.toISOString(),
      activities: activities.map(activity => ({
        ...activity,
        createdAt: activity.createdAt.toISOString(),
      })),
    } as TeamPageTeam;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

export default async function TeamPage({ params }: TeamPageProps) {
  const session = await getServerSession(authOptions) as Session | null;
  
  if (!session) {
    redirect('/');
  }

  const { teamSlug } = await params;
  const team = await fetchTeam(teamSlug);
  
  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Team not found</h1>
            <p className="text-muted-foreground">The team you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  return <TeamPageClient initialTeam={team} teamSlug={teamSlug} />;
}