import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSlug, generateUniqueSlug } from '@/lib/slugUtil';
import { getAuthenticatedUser } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user (will handle upsert automatically)
    const authenticatedUser = await getAuthenticatedUser(req);

    // Get user with team memberships
    const user = await prisma.user.findUnique({
      where: { id: authenticatedUser.id },
      include: {
        teamMemberships: {
          include: {
            team: {
              include: {
                _count: {
                  select: {
                    members: true,
                    projects: true,
                  },
                },
              },
            },
          },
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If user has no team memberships, return empty array
    const teams = user.teamMemberships?.map((membership) => ({
      ...membership.team,
      role: membership.role,
      joinedAt: membership.joinedAt,
    })) || [];

    return NextResponse.json(teams);
  } catch (error) {
    if (error instanceof Error && error.message === 'No authenticated user found') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (will handle upsert automatically)
    const user = await getAuthenticatedUser(request);

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Generate a unique slug for the team
    const baseSlug = generateSlug(name);
    const existingTeams = await prisma.team.findMany({
      select: { slug: true }
    });
    const existingSlugs = existingTeams.map(t => t.slug);
    const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

    // Check if slug is already taken (additional safety check)
    const existingTeam = await prisma.team.findUnique({
      where: { slug: uniqueSlug },
    });

    if (existingTeam) {
      return NextResponse.json({ error: 'Unable to generate unique team slug. Please try again.' }, { status: 409 });
    }

    // Create the team
    const team = await prisma.team.create({
      data: {
        name,
        slug: uniqueSlug,
        description,
        createdById: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
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

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'No authenticated user found') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
