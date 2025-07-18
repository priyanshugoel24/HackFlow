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
import { Metadata } from 'next';

interface ProjectPageProps {
  params: Promise<{
    teamSlug: string;
    projectSlug: string;
  }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { teamSlug, projectSlug } = await params;
  
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return {
        title: 'Project Dashboard',
        description: 'Access your project dashboard to manage tasks and collaborate.',
      };
    }

    // Get project and team data for metadata
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      select: {
        name: true,
        description: true,
        tags: true,
        _count: {
          select: {
            contextCards: true,
            members: true,
          },
        },
        team: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!project) {
      return {
        title: 'Project Not Found',
        description: 'The requested project could not be found.',
      };
    }

    const title = `${project.name} - Project Dashboard | ${project.team?.name}`;
    const description = project.description || `Manage ${project.name} project with ${project._count.contextCards} context cards and ${project._count.members} team members. Collaborate efficiently on tasks and track progress.`;

    const keywords = [
      'project management',
      'task tracking',
      'team collaboration',
      project.name,
      project.team?.name || '',
      ...(project.tags || []),
    ].filter(Boolean);

    return {
      title,
      description,
      keywords,
      openGraph: {
        title: `${project.name} - Project Dashboard | ${project.team?.name} | Context Board`,
        description,
        type: 'website',
        locale: 'en_US',
        siteName: 'Context Board',
      },
      twitter: {
        card: 'summary',
        title: `${project.name} - Project Dashboard | ${project.team?.name} | Context Board`,
        description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch (error) {
    console.error('Error generating metadata for project page:', error);
    return {
      title: 'Project Dashboard',
      description: 'Access your project dashboard to manage tasks and collaborate.',
    };
  }
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
        activities: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
            project: {
              select: { id: true, name: true, slug: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
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
        activities: project.activities.map(activity => ({
          ...activity,
          createdAt: activity.createdAt.toISOString(),
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
