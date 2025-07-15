import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  try {
    const token = await getToken({ req: request });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { teamSlug } = await params;
    const { hackathonModeEnabled, hackathonDeadline } = await request.json();

    // Check if user is an owner or admin of the team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        team: { slug: teamSlug },
        user: { email: token.email },
        status: 'ACTIVE',
        role: { in: ['OWNER', 'ADMIN'] },
      },
      include: {
        team: true,
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Access denied. Only team owners and admins can manage hackathon settings.' }, { status: 403 });
    }

    // Validate deadline if hackathon is being enabled
    if (hackathonModeEnabled && hackathonDeadline) {
      const deadline = new Date(hackathonDeadline);
      const now = new Date();
      
      if (deadline <= now) {
        return NextResponse.json({ error: 'Hackathon deadline must be in the future' }, { status: 400 });
      }
    }

    // Update team hackathon settings
    const updatedTeam = await prisma.team.update({
      where: { id: teamMember.teamId },
      data: {
        hackathonModeEnabled: hackathonModeEnabled ?? false,
        hackathonDeadline: hackathonDeadline ? new Date(hackathonDeadline) : null,
      },
    });

    return NextResponse.json({ 
      success: true, 
      team: {
        id: updatedTeam.id,
        hackathonModeEnabled: updatedTeam.hackathonModeEnabled,
        hackathonDeadline: updatedTeam.hackathonDeadline?.toISOString(),
      }
    });
  } catch (error) {
    console.error('Error updating team hackathon settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
