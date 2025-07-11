

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[id]/members
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  const { id } = await params;
  const { userId } = await req.json();

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
        OR: [{ createdById: user.id }, {
          members: {
            some: {
              userId: user.id,
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
    if (userId === user.id) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}