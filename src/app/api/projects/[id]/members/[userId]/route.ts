import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[id]/members/[userId]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id, userId } = await params;

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Check if the id is a CUID (database ID) or a slug
    const isCUID = /^c[a-z0-9]{24}$/.test(id);
    
    // Ensure the requesting user is a MANAGER of the project
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
        OR: [{ createdById: token.sub }, {
          members: {
            some: {
              userId: token.sub,
              role: "MANAGER",
              status: "ACTIVE"
            }
          }
        }]
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or permission denied" }, { status: 404 });
    }

    // Prevent user from removing themselves
    if (userId === token.sub) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    // Prevent removing the project creator
    if (userId === project.createdById) {
      return NextResponse.json({ error: "Cannot remove the project creator" }, { status: 400 });
    }

    // Check if the user is actually a member of the project
    const memberToRemove = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId: project.id,
          userId,
        },
      },
    });

    if (!memberToRemove) {
      return NextResponse.json({ error: "User is not a member of this project" }, { status: 404 });
    }

    // Delete member from project
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          projectId: project.id,
          userId,
        },
      },
    });

    console.log(`✅ Successfully removed user ${userId} from project ${project.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
