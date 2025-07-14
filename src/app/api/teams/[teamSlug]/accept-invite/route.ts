import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(
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
              email: token.email,
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

    if (existingMember.status === 'ACTIVE') {
      return NextResponse.json({ error: 'You are already a member of this team' }, { status: 400 });
    }

    if (existingMember.status !== 'INVITED') {
      return NextResponse.json({ error: 'Invalid invitation status' }, { status: 400 });
    }

    // Accept the invitation by updating status to ACTIVE
    let updatedMember;

    if (existingMember.userId === user.id) {
      // Direct match - just update the status
      updatedMember = await prisma.teamMember.update({
        where: {
          userId_teamId: {
            teamId: team.id,
            userId: user.id,
          },
        },
        data: {
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    } else {
      // Email match - need to transfer the invitation to the current user
      // First, delete the old placeholder invitation
      await prisma.teamMember.delete({
        where: {
          userId_teamId: {
            teamId: team.id,
            userId: existingMember.userId,
          },
        },
      });
      
      // Create a new membership for the current authenticated user
      updatedMember = await prisma.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: existingMember.role,
          status: 'ACTIVE',
          addedById: existingMember.addedById,
          joinedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    // Update team activity
    await prisma.team.update({
      where: { id: team.id },
      data: { lastActivityAt: new Date() },
    });

    // Automatically add the user as a member to all projects in this team
    // This gives them access to all team projects without requiring individual invitations
    const teamProjects = await prisma.project.findMany({
      where: { 
        teamId: team.id,
        isArchived: false 
      },
      select: { id: true, name: true }
    });

    console.log(`🔄 Adding user ${user.id} to ${teamProjects.length} team projects`);

    // Add user to each team project if they're not already a member
    for (const project of teamProjects) {
      try {
        await prisma.projectMember.upsert({
          where: {
            userId_projectId: {
              userId: user.id,
              projectId: project.id
            }
          },
          update: {
            status: "ACTIVE",
            role: "MEMBER"
          },
          create: {
            userId: user.id,
            projectId: project.id,
            role: "MEMBER",
            status: "ACTIVE",
            addedById: updatedMember.addedById, // Use the same person who invited them to the team
          }
        });
        console.log(`✅ Added user to project: ${project.name}`);
      } catch (error) {
        console.error(`❌ Failed to add user to project ${project.name}:`, error);
        // Continue with other projects even if one fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation accepted successfully',
      member: updatedMember 
    });
  } catch (error) {
    console.error('Error accepting team invitation:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
