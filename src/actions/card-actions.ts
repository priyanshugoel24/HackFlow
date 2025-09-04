'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/logActivity';
import { TaskStatus } from '@/interfaces/TaskStatus';
import { getAuthenticatedUserFromAction } from '@/lib/auth-utils';
import { findCardWithModifyAccess } from '@/lib/db-queries';

export async function archiveContextCard(cardId: string, isArchived: boolean) {
  try {
    const user = await getAuthenticatedUserFromAction();

    // Check if user has access to this card
    const card = await findCardWithModifyAccess(cardId, user.id, {
      include: {
        project: {
          include: {
            team: {
              select: {
                slug: true
              }
            }
          }
        }
      }
    });

    if (!card) {
      throw new Error('Card not found or access denied');
    }

    const updatedCard = await prisma.contextCard.update({
      where: { id: cardId },
      data: { 
        isArchived,
        updatedAt: new Date()
      },
    });

    // Log the activity
    await logActivity({
      type: "CARD_ARCHIVED",
      description: `${isArchived ? 'Archived' : 'Unarchived'} card "${card.title}"`,
      metadata: { cardId: card.id, isArchived },
      userId: user.id,
      projectId: card.projectId,
    });

    // Revalidate relevant paths - we'll fetch project separately for now
    const project = await prisma.project.findUnique({
      where: { id: card.projectId },
      include: {
        team: {
          select: {
            slug: true
          }
        }
      }
    });

    if (project?.team) {
      revalidatePath(`/team/${project.team.slug}/project/${project.slug}`);
    }

    return { success: true, card: updatedCard };
  } catch (error) {
    console.error('Error archiving context card:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to archive card');
  }
}

export async function updateContextCardStatus(cardId: string, status: TaskStatus) {
  try {
    const user = await getAuthenticatedUserFromAction();

    // Check if user has access to this card
    const card = await findCardWithModifyAccess(cardId, user.id, {
      include: {
        project: {
          include: {
            team: {
              select: {
                slug: true
              }
            }
          }
        }
      }
    });

    if (!card) {
      throw new Error('Card not found or access denied');
    }

    const updatedCard = await prisma.contextCard.update({
      where: { id: cardId },
      data: { 
        status: status,
        updatedAt: new Date()
      },
    });

    // Log the activity
    await logActivity({
      type: "CARD_UPDATED",
      description: `Updated card "${card.title}" status to ${status}`,
      metadata: { cardId: card.id, oldStatus: card.status, newStatus: status },
      userId: user.id,
      projectId: card.projectId,
    });

    // Revalidate relevant paths - we'll fetch project separately for now
    const project = await prisma.project.findUnique({
      where: { id: card.projectId },
      include: {
        team: {
          select: {
            slug: true
          }
        }
      }
    });

    if (project?.team) {
      revalidatePath(`/team/${project.team.slug}/project/${project.slug}`);
    }

    return { success: true, card: updatedCard };
  } catch (error) {
    console.error('Error updating context card status:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update card status');
  }
}
