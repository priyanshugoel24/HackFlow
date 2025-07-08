

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[id]/members
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const projectId = params.id;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    // Ensure the requesting user is a MANAGER of the project
    const isManager = await prisma.project.findFirst({
      where: {
        id: projectId,
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

    if (!isManager) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Prevent user from removing themselves
    if (userId === token.sub) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    // Delete member from project
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          projectId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}