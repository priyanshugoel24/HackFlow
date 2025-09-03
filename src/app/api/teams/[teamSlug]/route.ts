import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET
    });
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

    const { name, description } = await request.json();

    const team = await prisma.team.findUnique({
      where: { slug: resolvedParams.teamSlug },
      include: {
        members: {
          where: { 
            userId: user.id,
            role: { in: ['OWNER'] }
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.members.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: {
        name,
        description,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET
    });
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
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if current user is an owner of this team
    const userMembership = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: team.id,
        },
      },
    });

    if (!userMembership || userMembership.role !== 'OWNER' || userMembership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Only team owners can delete teams' }, { status: 403 });
    }

    // Cascade delete: Delete all related data in the correct order
    // 1. Delete context cards and their related data
    await prisma.contextCard.deleteMany({
      where: {
        project: {
          teamId: team.id
        }
      }
    });

    // 2. Delete projects
    await prisma.project.deleteMany({
      where: { teamId: team.id }
    });

    // 3. Delete team members
    await prisma.teamMember.deleteMany({
      where: { teamId: team.id }
    });

    // 4. Finally delete the team
    await prisma.team.delete({
      where: { id: team.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Team deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
