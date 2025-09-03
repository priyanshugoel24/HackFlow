import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/logActivity';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET
    });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamSlug } = await params;
    const body = await request.json();
    const { hackathonModeEnabled, hackathonDeadline, hackathonEndedAt } = body;

    // Check if user is an admin or owner of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        team: { slug: teamSlug },
        user: { email: token.email },
        status: 'ACTIVE',
        role: { in: ['OWNER'] },
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
        hackathonEndedAt: hackathonEndedAt ? new Date(hackathonEndedAt) : undefined,
      },
    });

    // Log activity
    if (hackathonModeEnabled !== undefined) {
      // Log activity for all projects in the team
      const projects = await prisma.project.findMany({
        where: { teamId: teamMember.teamId },
      });

      const activityPromises = projects.map(project =>
        logActivity({
          type: hackathonModeEnabled ? 'HACKATHON_STARTED' : 'HACKATHON_ENDED',
          description: hackathonModeEnabled 
            ? `Hackathon mode enabled for team ${teamMember.team.name}` 
            : `Hackathon mode disabled for team ${teamMember.team.name}`,
          userId: teamMember.user.id,
          projectId: project.id,
          metadata: {
            teamId: teamMember.teamId,
            teamSlug: teamMember.team.slug,
            hackathonDeadline: hackathonDeadline || null,
          },
        })
      );

      await Promise.allSettled(activityPromises);
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
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET
    });
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
            hackathonEndedAt: true,
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
      hackathonEndedAt: teamMember.team.hackathonEndedAt,
    });
  } catch (error) {
    console.error('Error fetching hackathon settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
