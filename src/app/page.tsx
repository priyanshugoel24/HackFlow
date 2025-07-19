import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import LoginPage from '@/components/LoginPage';
import TeamsDisplay from '@/components/TeamsDisplay';
import { TeamWithRelations } from '@/interfaces/TeamWithRelations';
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export async function generateMetadata(): Promise<Metadata> {
  const session = await getServerSession(authOptions) as Session | null;
  const userName = session?.user?.name || 'User';
  
  return {
    title: 'Your Personal Context Management Dashboard',
    description: 'Organize your projects, teams, and tasks in one collaborative workspace. Create context cards, track progress, and manage your workflow efficiently.',
    keywords: ['project management', 'team collaboration', 'task tracking', 'context board', 'productivity'],
    authors: [{ name: 'Context Board Team' }],
    creator: 'Context Board',
    openGraph: {
      title: 'Context Board - Your Personal Context Management Dashboard',
      description: 'Organize your projects, teams, and tasks in one collaborative workspace. Create context cards, track progress, and manage your workflow efficiently.',
      type: 'website',
      locale: 'en_US',
      siteName: 'Context Board',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Context Board - Your Personal Context Management Dashboard',
      description: 'Organize your projects, teams, and tasks in one collaborative workspace.',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-zinc-900 dark:to-zinc-800" suppressHydrationWarning>
      <Navbar />
      <TeamsDisplay initialTeams={teams} />
    </div>
  );
}