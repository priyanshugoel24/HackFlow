import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, ensure the user exists in the database and get the actual user
    const user = await prisma.user.upsert({
      where: { email: token.email! },
      update: {
        name: token.name,
        image: token.picture,
      },
      create: {
        email: token.email!,
        name: token.name,
        image: token.picture,
      },
    });

    const resolvedParams = await params;
    const team = await prisma.team.findUnique({
      where: { slug: resolvedParams.teamSlug },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const membership = team.members[0];
    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all cards assigned to the current user across all team projects
    const assignedCards = await prisma.contextCard.findMany({
      where: {
        assignedToId: user.id,
        project: {
          teamId: team.id,
        },
        isArchived: false,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdById: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
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
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(assignedCards);
  } catch (error) {
    console.error('Error fetching assigned cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
