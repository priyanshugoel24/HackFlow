import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import dynamic from 'next/dynamic';
import { authOptions } from '@/lib/auth';
import { TeamHackathon } from '@/interfaces/TeamHackathon';
import { ContextCardWithRelations } from '@/interfaces/ContextCardWithRelations';
import { HackathonUpdate } from '@/interfaces/HackathonUpdate';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

// Lazy load HackathonPageClient for better performance
const HackathonPageClient = dynamic(() => import('@/components/HackathonPageClient'), {
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading hackathon room...</p>
      </div>
    </div>
  )
});

interface HackathonPageProps {
  params: Promise<{
    teamSlug: string;
  }>;
}

// Server-side data fetching for team data
async function fetchTeamData(teamSlug: string): Promise<TeamHackathon | null> {
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
                emailVerified: true,
                lastSeenat: true,
              },
            },
          },
          where: { status: 'ACTIVE' },
        },
        projects: {
          include: {
            createdBy: true,
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

    return {
      ...team,
      userRole: userMembership.role,
      currentUserId: user.id,
      hackathonDeadline: team.hackathonDeadline?.toISOString(),
      members: team.members.map(member => ({
        ...member,
        joinedAt: member.joinedAt.toISOString(),
        team: {
          ...team,
          createdAt: team.createdAt.toISOString(),
        },
      })),
      projects: team.projects.map(project => ({
        ...project,
        createdAt: project.createdAt.toISOString(),
        lastActivityAt: project.lastActivityAt.toISOString(),
      })),
    } as unknown as TeamHackathon;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

// Server-side data fetching for hackathon cards
async function fetchHackathonCards(teamSlug: string): Promise<ContextCardWithRelations[]> {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return [];
    }

    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      select: { id: true },
    });

    if (!team) {
      return [];
    }

    const cards = await prisma.contextCard.findMany({
      where: {
        project: {
          teamId: team.id,
        },
        isArchived: false,
        type: 'TASK',
      },
      include: {
        project: {
          include: {
            team: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return cards.map(card => ({
      ...card,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    })) as unknown as ContextCardWithRelations[];
  } catch (error) {
    console.error('Error fetching hackathon cards:', error);
    return [];
  }
}

// Server-side data fetching for hackathon updates
async function fetchHackathonUpdates(): Promise<HackathonUpdate[]> {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return [];
    }

    // For now, return empty array as we don't have hackathon updates implemented yet
    // This can be expanded later when the hackathon updates feature is implemented
    return [];
  } catch (error) {
    console.error('Error fetching hackathon updates:', error);
    return [];
  }
}

export default async function TeamHackathonPage({ params }: HackathonPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/');
  }

  const { teamSlug } = await params;

  // Fetch initial data server-side
  const team = await fetchTeamData(teamSlug);
  
  // Only fetch cards and updates if hackathon mode is enabled
  const cards = team?.hackathonModeEnabled ? await fetchHackathonCards(teamSlug) : [];
  const updates = team?.hackathonModeEnabled ? await fetchHackathonUpdates() : [];

  return (
    <HackathonPageClient 
      initialTeam={team}
      initialCards={cards}
      initialUpdates={updates}
    />
  );
}
