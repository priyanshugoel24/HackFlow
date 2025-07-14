import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; userId: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, ensure the requesting user exists in the database
    const requestingUser = await prisma.user.upsert({
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
    const { teamSlug, userId } = resolvedParams;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Find the team and verify permissions
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      include: {
        members: {
          where: {
            userId: requestingUser.id,
            role: { in: ['OWNER', 'ADMIN'] },
            status: 'ACTIVE'
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if requesting user has permission to remove members
    if (team.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prevent user from removing themselves
    if (userId === requestingUser.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });
    }

    // Check if the member to be removed exists
    // First try to find by user ID, then by member ID for backwards compatibility
    let memberToRemove = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: userId,
          teamId: team.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If not found by user ID, try to find by member ID
    if (!memberToRemove) {
      memberToRemove = await prisma.teamMember.findUnique({
        where: {
          id: userId, // userId parameter might actually be member ID
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      
      // Ensure the member belongs to this team
      if (memberToRemove && memberToRemove.teamId !== team.id) {
        memberToRemove = null;
      }
    }

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent user from removing themselves
    if (memberToRemove.userId === requestingUser.id) {
      return NextResponse.json({ error: 'You cannot remove yourself from the team' }, { status: 400 });
    }

    // Check if the requesting user has permission to remove this member
    const requestingMember = team.members[0]; // We already filtered for the requesting user
    
    // Only OWNER can remove ADMIN/MEMBER, and ADMIN can remove MEMBER
    if (requestingMember.role === 'MEMBER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    if (requestingMember.role === 'ADMIN' && memberToRemove.role !== 'MEMBER') {
      return NextResponse.json({ error: 'Admins can only remove members' }, { status: 403 });
    }

    // Remove the member
    await prisma.teamMember.delete({
      where: {
        id: memberToRemove.id,
      },
    });

    // Update team activity
    await prisma.team.update({
      where: { id: team.id },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ 
      success: true,
      message: `${memberToRemove.user.name || memberToRemove.user.email} has been removed from the team`
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
