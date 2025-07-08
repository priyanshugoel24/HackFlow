import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAblyServer } from "@/lib/ably";

// POST /api/projects/[id]/invite
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { email } = await req.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Check if the id is a CUID (database ID) or a slug
    const isCUID = /^c[a-z0-9]{24}$/.test(id);
    
    // Ensure the requesting user is a MANAGER of the project or the project creator
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
        OR: [
          { createdById: token.sub }, 
          {
            members: {
              some: {
                userId: token.sub,
                role: "MANAGER",
                status: "ACTIVE"
              }
            }
          }
        ]
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or permission denied" }, { status: 404 });
    }

    console.log(`🔍 Attempting to invite user ${email.trim().toLowerCase()} to project ${project.id}`);

    // Find the user by email, or create a placeholder user if they don't exist
    let userToInvite = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // If user doesn't exist, create a placeholder user record
    if (!userToInvite) {
      console.log(`👤 Creating new user record for ${email.trim().toLowerCase()}`);
      userToInvite = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          // Name and other fields will be filled when they first log in
        },
      });
    } else {
      console.log(`👤 Found existing user: ${userToInvite.id}`);
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId: project.id,
          userId: userToInvite.id,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === "ACTIVE") {
        return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 });
      } else if (existingMember.status === "INVITED") {
        return NextResponse.json({ error: "User is already invited to this project" }, { status: 400 });
      }
    }

    // Prevent inviting yourself
    if (userToInvite.id === token.sub) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    // Create or update the membership
    const newMember = await prisma.projectMember.upsert({
      where: {
        userId_projectId: {
          projectId: project.id,
          userId: userToInvite.id,
        },
      },
      update: {
        status: "INVITED",
        addedById: token.sub,
        joinedAt: new Date(),
      },
      create: {
        projectId: project.id,
        userId: userToInvite.id,
        role: "MEMBER",
        status: "INVITED",
        addedById: token.sub,
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
      },
    });

    // Update project activity
    await prisma.project.update({
      where: { id: project.id },
      data: { lastActivityAt: new Date() },
    });

    // Publish real-time update to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(`project:${project.id}`);
      
      await channel.publish("member:added", {
        id: newMember.id,
        userId: newMember.userId,
        projectId: newMember.projectId,
        role: newMember.role,
        status: newMember.status,
        joinedAt: newMember.joinedAt,
        user: newMember.user
      });
      
      console.log("📡 Published member:added event to Ably for project:", project.id);
    } catch (ablyError) {
      console.error("❌ Failed to publish to Ably:", ablyError);
      // Don't fail the entire request if Ably publish fails
    }

    console.log(`✅ Successfully invited user ${userToInvite.email} to project ${project.id}`);

    return NextResponse.json({ 
      success: true, 
      message: "User invited successfully",
      member: newMember 
    });
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json({ error: "Failed to invite member" }, { status: 500 });
  }
}
