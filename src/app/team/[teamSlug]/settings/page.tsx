import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import TeamSettingsPageClient from '@/components/TeamSettingsPageClient';
import { TeamSettingsTeam } from '@/interfaces/TeamSettingsTeam';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

interface TeamSettingsPageProps {
  params: Promise<{
    teamSlug: string;
  }>;
}

// Server-side data fetching
async function fetchTeam(teamSlug: string): Promise<TeamSettingsTeam | null> {
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
    } as unknown as TeamSettingsTeam;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const session = await getServerSession(authOptions);
  
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
            <p className="text-muted-foreground">The team you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  return <TeamSettingsPageClient team={team} teamSlug={teamSlug} />;
}
