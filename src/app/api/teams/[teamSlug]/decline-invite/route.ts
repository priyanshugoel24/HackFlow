import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    const resolvedParams = await params;
    const team = await prisma.team.findUnique({
      where: { slug: resolvedParams.teamSlug },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user has a pending invitation
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        OR: [
          {
            userId: user.id,
            teamId: team.id,
          },
          {
            user: {
              email: user.email,
            },
            teamId: team.id,
          },
        ],
      },
      include: {
        user: true,
      },
    });

    if (!existingMember) {
      return NextResponse.json({ error: 'No invitation found for this team' }, { status: 404 });
    }

    if (existingMember.status !== 'INVITED') {
      return NextResponse.json({ error: 'No pending invitation to decline' }, { status: 400 });
    }

    // Decline the invitation by deleting the membership record
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          teamId: team.id,
          userId: existingMember.userId,
        },
      },
    });

    // Update team activity
    await prisma.team.update({
      where: { id: team.id },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation declined successfully'
    });
  } catch (error) {
    console.error('Error declining team invitation:', error);
    return NextResponse.json({ error: 'Failed to decline invitation' }, { status: 500 });
  }
}
