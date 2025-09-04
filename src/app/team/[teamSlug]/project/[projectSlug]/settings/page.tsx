import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ProjectSettingsPageClient from '@/components/ProjectSettingsPageClient';
import { prisma } from '@/lib/prisma';
import { ProjectSettingsPageProps } from '@/interfaces/ProjectSettingsPageProps';
import { Session } from 'next-auth';
import { ProjectData } from '@/interfaces/ProjectData';
import { getAuthenticatedUserFromSession } from '@/lib/auth-utils';

// Server-side data fetching
async function fetchProject(teamSlug: string, projectSlug: string): Promise<ProjectData | null> {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    // Get authenticated user
    const user = await getAuthenticatedUserFromSession(session);
    if (!user) {
      return null;
    }

    // Get project data
    const project = await prisma.project.findUnique({
      where: {
        slug: projectSlug,
      },
      include: {
        contextCards: {
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });    if (!project || !project.team || project.team.slug !== teamSlug) {
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
      description: project.description || undefined,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.lastActivityAt.toISOString(),
      teamId: project.teamId || "",
      tags: project.tags || [],
      team: project.team ? {
        id: project.team.id,
        name: project.team.name,
        slug: project.team.slug,
      } : undefined,
    } as ProjectData;
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

  const { teamSlug, projectSlug } = await params;
  const project = await fetchProject(teamSlug, projectSlug);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <p className="text-muted-foreground">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
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