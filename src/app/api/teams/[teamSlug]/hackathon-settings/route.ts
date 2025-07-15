import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/logActivity';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamSlug } = await params;
    const body = await request.json();
    const { hackathonModeEnabled, hackathonDeadline } = body;

    // Check if user is an admin or owner of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        team: { slug: teamSlug },
        user: { email: token.email },
        status: 'ACTIVE',
        role: { in: ['OWNER', 'ADMIN'] },
      },
      include: {
        team: true,
        user: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update hackathon settings
    const updatedTeam = await prisma.team.update({
      where: { id: teamMember.teamId },
      data: {
        hackathonModeEnabled: hackathonModeEnabled ?? undefined,
        hackathonDeadline: hackathonDeadline ? new Date(hackathonDeadline) : undefined,
      },
    });

    // Log activity
    if (hackathonModeEnabled !== undefined) {
      // For team activities, we'll log against the first project or create a general activity
      const firstProject = await prisma.project.findFirst({
        where: { teamId: teamMember.teamId },
      });

      if (firstProject) {
        await logActivity({
          type: hackathonModeEnabled ? 'HACKATHON_STARTED' : 'HACKATHON_ENDED',
          description: hackathonModeEnabled 
            ? `Hackathon mode enabled for team ${teamMember.team.name}` 
            : `Hackathon mode disabled for team ${teamMember.team.name}`,
          userId: teamMember.user.id,
          projectId: firstProject.id,
          metadata: {
            teamId: teamMember.teamId,
            teamSlug: teamMember.team.slug,
            hackathonDeadline: hackathonDeadline || null,
          },
        });
      }
    }

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating hackathon settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamSlug } = await params;

    // Check if user is a member of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        team: { slug: teamSlug },
        user: { email: token.email },
        status: 'ACTIVE',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            hackathonModeEnabled: true,
            hackathonDeadline: true,
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      hackathonModeEnabled: teamMember.team.hackathonModeEnabled,
      hackathonDeadline: teamMember.team.hackathonDeadline,
    });
  } catch (error) {
    console.error('Error fetching hackathon settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
