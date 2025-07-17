import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Navbar from "@/components/Navbar";
import LoginPage from "@/components/LoginPage";
import ProjectPageClient from "@/components/ProjectPageClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ProjectPageProject } from '@/interfaces/ProjectPageProject';
import { ProjectPageTeam } from '@/interfaces/ProjectPageTeam';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

interface ProjectPageProps {
  params: Promise<{
    teamSlug: string;
    projectSlug: string;
  }>;
}

// Server-side data fetching
async function fetchProjectData(teamSlug: string, projectSlug: string): Promise<{
  project: ProjectPageProject;
  team: ProjectPageTeam;
} | null> {
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

    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
              where: { status: 'ACTIVE' },
            },
          },
        },
        contextCards: {
          include: {
            user: true,
            assignedTo: true,
          },
          where: { isArchived: false },
          orderBy: { createdAt: 'desc' },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project || !project.team || project.team.slug !== teamSlug) {
      return null;
    }

    // Check if user is a member of this team
    const userMembership = project.team.members.find(
      (member) => member.userId === user.id
    );

    if (!userMembership) {
      return null;
    }

    return {
      project: {
        ...project,
        createdAt: project.createdAt.toISOString(),
        lastActivityAt: project.lastActivityAt.toISOString(),
        contextCards: project.contextCards.map(card => ({
          ...card,
          createdAt: card.createdAt.toISOString(),
          updatedAt: card.updatedAt.toISOString(),
        })),
      } as unknown as ProjectPageProject,
      team: {
        ...project.team,
        createdAt: project.team.createdAt.toISOString(),
        members: project.team.members.map(member => ({
          ...member,
          joinedAt: member.joinedAt.toISOString(),
        })),
      } as unknown as ProjectPageTeam,
    };
  } catch (error) {
    console.error('Error fetching project data:', error);
    return null;
  }
}

export default async function TeamProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/');
  }

  const { teamSlug, projectSlug } = await params;
  const data = await fetchProjectData(teamSlug, projectSlug);
  
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Project Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => redirect(`/team/${teamSlug}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProjectPageClient 
      project={data.project}
      team={data.team}
      teamSlug={teamSlug}
      projectSlug={projectSlug}
    />
  );
}
