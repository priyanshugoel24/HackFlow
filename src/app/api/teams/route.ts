import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { generateSlug, generateUniqueSlug } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, ensure the user exists in the database and get the actual user
    const user = await prisma.user.upsert({
      where: { email: token.email },
      update: {
        name: token.name,
        image: token.picture,
      },
      create: {
        email: token.email,
        name: token.name,
        image: token.picture,
      },
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

    // If user has no team memberships, return empty array
    const teams = user.teamMemberships?.map((membership) => ({
      ...membership.team,
      role: membership.role,
      joinedAt: membership.joinedAt,
    })) || [];

    return NextResponse.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET
    });
    
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, ensure the user exists in the database and get the actual user
    const user = await prisma.user.upsert({
      where: { email: token.email },
      update: {
        name: token.name,
        image: token.picture,
      },
      create: {
        email: token.email,
        name: token.name,
        image: token.picture,
      },
    });

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
    console.error('Error creating team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
