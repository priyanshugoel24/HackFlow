import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import dynamic from 'next/dynamic';
import { authOptions } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { AssignedCardsTeam } from '@/interfaces/AssignedCardsTeam';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

// Lazy load AssignedCardsPageClient
const AssignedCardsPageClient = dynamic(() => import('@/components/AssignedCardsPageClient'), {
  loading: () => (
    <div className="container mx-auto p-6">
      <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
    </div>
  )
});

interface AssignedCardsPageProps {
  params: Promise<{
    teamSlug: string;
  }>;
}

// Server-side data fetching
async function fetchTeam(teamSlug: string): Promise<AssignedCardsTeam | null> {
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
    } as AssignedCardsTeam;
  } catch (error) {
    console.error('Error fetching team:', error);
    return null;
  }
}

export default async function TeamAssignedCardsPage({ params }: AssignedCardsPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/');
  }

  const { teamSlug } = await params;
  const team = await fetchTeam(teamSlug);

  if (!team) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Team not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AssignedCardsPageClient team={team} />;
}
