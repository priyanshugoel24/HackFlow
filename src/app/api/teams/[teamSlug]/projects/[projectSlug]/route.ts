import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; projectSlug: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    const { teamSlug, projectSlug } = await params;

    // Find the team and verify user membership
    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      include: {
        members: {
          where: {
            user: { email: user.email },
            status: 'ACTIVE'
          }
        }
      }
    });

    if (!team || team.members.length === 0) {
      return NextResponse.json({ error: 'Team not found or access denied' }, { status: 404 });
    }

    // Find the project
    const project = await prisma.project.findFirst({
      where: {
        slug: projectSlug,
        teamId: team.id
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
