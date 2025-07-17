import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import LoginPage from '@/components/LoginPage';
import TeamsDisplay from '@/components/TeamsDisplay';
import { TeamWithRelations } from '@/interfaces/TeamWithRelations';
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

// Server-side data fetching using Prisma directly
async function fetchTeams(session: Session): Promise<TeamWithRelations[]> {
  try {
    if (!session?.user?.email) {
      return [];
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
      include: {
        teamMemberships: {
          include: {
            team: {
              include: {
                createdBy: true,
                members: {
                  include: {
                    user: true,
                  },
                  where: { status: 'ACTIVE' },
                },
                projects: {
                  include: {
                    createdBy: true,
                    members: {
                      include: {
                        user: true,
                      },
                    },
                  },
                  where: { isArchived: false },
                },
                _count: {
                  select: {
                    members: true,
                    projects: true,
                  },
                },
              },
            },
          },
          where: { status: 'ACTIVE' },
        },
      },
    });

    // If user has no team memberships, return empty array
    const teams = user.teamMemberships?.map((membership) => ({
      ...membership.team,
      role: membership.role,
      joinedAt: membership.joinedAt,
      members: membership.team.members.map(member => ({
        ...member,
        team: membership.team,
      })),
    })) as TeamWithRelations[] || [];

    return teams;
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

export default async function Home() {
  const session = await getServerSession(authOptions) as Session | null;

  if (!session) {
    return <LoginPage />;
  }

  // Fetch teams server-side using Prisma directly
  const teams = await fetchTeams(session);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      <Navbar />
      <TeamsDisplay initialTeams={teams} />
    </div>
  );
}