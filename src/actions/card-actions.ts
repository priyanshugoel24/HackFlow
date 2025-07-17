'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Session } from 'next-auth';
import { logActivity } from '@/lib/logActivity';

export async function archiveContextCard(cardId: string, isArchived: boolean) {
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

    // Check if user has access to this card
    const card = await prisma.contextCard.findFirst({
      where: {
        id: cardId,
        OR: [
          { userId: user.id },
          { assignedToId: user.id },
          {
            project: {
              OR: [
                { createdById: user.id },
                {
                  members: {
                    some: {
                      userId: user.id,
                      status: "ACTIVE"
                    }
                  }
                },
                {
                  team: {
                    members: {
                      some: {
                        userId: user.id,
                        status: "ACTIVE"
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      },
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
      type: isArchived ? "CARD_ARCHIVED" : "CARD_UNARCHIVED",
      description: `${isArchived ? 'Archived' : 'Unarchived'} card "${card.title}"`,
      metadata: { cardId: card.id },
      userId: user.id,
      projectId: card.projectId,
    });

    // Revalidate relevant paths
    if (card.project.team) {
      revalidatePath(`/team/${card.project.team.slug}/project/${card.project.slug}`);
    }

    return { success: true, card: updatedCard };
  } catch (error) {
    console.error('Error archiving context card:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to archive card');
  }
}

export async function updateContextCardStatus(cardId: string, status: string) {
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

    // Check if user has access to this card
    const card = await prisma.contextCard.findFirst({
      where: {
        id: cardId,
        OR: [
          { userId: user.id },
          { assignedToId: user.id },
          {
            project: {
              OR: [
                { createdById: user.id },
                {
                  members: {
                    some: {
                      userId: user.id,
                      status: "ACTIVE"
                    }
                  }
                },
                {
                  team: {
                    members: {
                      some: {
                        userId: user.id,
                        status: "ACTIVE"
                      }
                    }
                  }
                }
              ]
            }
          }
        ]
      },
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
        status: status as any, // Type assertion for TaskStatus enum
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

    // Revalidate relevant paths
    if (card.project.team) {
      revalidatePath(`/team/${card.project.team.slug}/project/${card.project.slug}`);
    }

    return { success: true, card: updatedCard };
  } catch (error) {
    console.error('Error updating context card status:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update card status');
  }
}
