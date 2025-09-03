import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    const { teamSlug } = await params;

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        team: { slug: teamSlug },
        user: { email: user.email },
        status: 'ACTIVE',
      },
      include: {
        team: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all active task cards from all team projects
    const cards = await prisma.contextCard.findMany({
      where: {
        project: {
          teamId: teamMember.teamId,
          isArchived: false,
        },
        type: 'TASK',
        status: { not: 'CLOSED' },
        isArchived: false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error fetching team hackathon cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
