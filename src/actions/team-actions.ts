'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedUserFromAction } from '@/lib/auth-utils';
import { getUserTeamMembership, findProjectWithOwnerAccess } from '@/lib/db-queries';

export async function updateTeamHackathonSettings(teamSlug: string, hackathonModeEnabled: boolean, hackathonDeadline?: string) {
  try {
    const user = await getAuthenticatedUserFromAction();

    // Check if user is an owner or admin of the team
    const teamMember = await getUserTeamMembership(user.id, teamSlug);

    if (!teamMember || teamMember.role !== 'OWNER') {
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
    const user = await getAuthenticatedUserFromAction();

    // Check if the user has permission to archive this project
    const project = await findProjectWithOwnerAccess(projectId, user.id, {
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
    if (project?.team) {
      revalidatePath(`/team/${project.team.slug}`);
      revalidatePath(`/team/${project.team.slug}/project/${project.slug}`);
    }

    return { success: true, project: updatedProject };
  } catch (error) {
    console.error('Error archiving project:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to archive project');
  }
}
