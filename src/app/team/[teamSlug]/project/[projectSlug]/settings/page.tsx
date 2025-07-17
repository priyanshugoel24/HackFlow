import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Loader2 } from "lucide-react";
import ProjectSettingsPageClient from '@/components/ProjectSettingsPageClient';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

interface ProjectSettingsPageProps {
  params: Promise<{
    teamSlug: string;
    projectSlug: string;
  }>;
}

// Server-side data fetching
async function fetchProject(projectSlug: string): Promise<any> {
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
        createdBy: true,
        members: {
          include: {
            user: true,
          },
        },
        contextCards: {
          include: {
            user: true,
            assignedTo: true,
          },
          where: { isArchived: false },
        },
      },
    });

    if (!project || !project.team) {
      return null;
    }

    // Check if user is a member of the project's team
    const userMembership = project.team.members.find(
      (member) => member.user.id === user.id
    );

    if (!userMembership) {
      return null;
    }

    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      lastActivityAt: project.lastActivityAt.toISOString(),
      contextCards: project.contextCards.map(card => ({
        ...card,
        createdAt: card.createdAt.toISOString(),
        updatedAt: card.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/');
  }

  const { projectSlug } = await params;
  const project = await fetchProject(projectSlug);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <ProjectSettingsPageClient 
      project={project}
      projectSlug={projectSlug}
    />
  );
}