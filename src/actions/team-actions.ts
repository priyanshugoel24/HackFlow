'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Session } from 'next-auth';

export async function updateTeamHackathonSettings(teamSlug: string, hackathonModeEnabled: boolean, hackathonDeadline?: string) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
    }

    // Check if user is an owner or admin of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        team: { slug: teamSlug },
        user: { email: session.user.email },
        status: 'ACTIVE',
        role: { in: ['OWNER'] },
      },
      include: {
        team: true,
      },
    });

    if (!teamMember) {
      throw new Error('Access denied');
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamMember.team.id },
      data: {
        hackathonModeEnabled,
        hackathonDeadline: hackathonDeadline ? new Date(hackathonDeadline) : null,
      },
    });

    // Revalidate the team page to reflect changes
    revalidatePath(`/team/${teamSlug}`);
    revalidatePath(`/team/${teamSlug}/hackathon`);

    return { success: true, team: updatedTeam };
  } catch (error) {
    console.error('Error updating hackathon settings:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update hackathon settings');
  }
}

export async function archiveProject(projectId: string, isArchived: boolean) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      throw new Error('Unauthorized');
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

    // Check if the user has permission to archive this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { createdById: user.id },
          {
            team: {
              members: {
                some: {
                  userId: user.id,
                  role: { in: ["OWNER"] },
                  status: "ACTIVE"
                }
              }
            }
          }
        ]
      },
      include: {
        team: {
          select: {
            slug: true
          }
        }
      }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { 
        isArchived,
        lastActivityAt: new Date()
      },
    });

    // Revalidate relevant paths
    if (project.team) {
      revalidatePath(`/team/${project.team.slug}`);
      revalidatePath(`/team/${project.team.slug}/project/${project.slug}`);
    }

    return { success: true, project: updatedProject };
  } catch (error) {
    console.error('Error archiving project:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to archive project');
  }
}
