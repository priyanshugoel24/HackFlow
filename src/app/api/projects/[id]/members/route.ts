import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Helper function to check if user is a manager of the project
async function isProjectManager(userId: string, projectId: string) {
  const membership = await prisma.projectMember.findFirst({
    where: {
      userId,
      projectId,
      role: "MANAGER",
      status: "ACTIVE"
    }
  });
  return !!membership;
}

// GET: Get all members of a project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if user has access to this project
    const userMembership = await prisma.projectMember.findFirst({
      where: {
        userId: token.sub,
        projectId: id,
        status: "ACTIVE"
      }
    });

    if (!userMembership) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    const members = await prisma.projectMember.findMany({
      where: {
        projectId: id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { joinedAt: "asc" }
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

// POST: Add a new member to the project
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { email, role = "MEMBER" } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Check if user is a manager of this project
    const isManager = await isProjectManager(token.sub, id);
    if (!isManager) {
      return NextResponse.json({ error: "Only project managers can add members" }, { status: 403 });
    }

    // Find the user to add
    const userToAdd = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        userId: userToAdd.id,
        projectId: id
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 400 });
    }

    // Add the member
    const newMember = await prisma.projectMember.create({
      data: {
        userId: userToAdd.id,
        projectId: id,
        role: role as "MANAGER" | "MEMBER",
        status: "INVITED",
        addedById: token.sub
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ member: newMember });
  } catch (error) {
    console.error("Error adding project member:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

// DELETE: Remove a member from the project
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Check if user is a manager of this project
    const isManager = await isProjectManager(token.sub, id);
    if (!isManager && userId !== token.sub) {
      return NextResponse.json({ error: "Only project managers can remove members or members can remove themselves" }, { status: 403 });
    }

    // Find the membership
    const membership = await prisma.projectMember.findFirst({
      where: {
        userId,
        projectId: id
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Don't allow removing the last manager
    if (membership.role === "MANAGER") {
      const managerCount = await prisma.projectMember.count({
        where: {
          projectId: id,
          role: "MANAGER",
          status: "ACTIVE"
        }
      });

      if (managerCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last manager" }, { status: 400 });
      }
    }

    // Remove the member
    await prisma.projectMember.delete({
      where: {
        id: membership.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
