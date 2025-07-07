import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { email, role = "MEMBER" } = await req.json();
  const { id } = await params;
  const projectId = id;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // First check if the current user has permission to invite (must be project creator or manager)
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
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
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or you don't have permission to invite members" }, { status: 403 });
    }

    // Find the user to invite
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if user is already a member
    const existing = await prisma.projectMember.findFirst({
      where: { userId: user.id, projectId }
    });

    if (existing) return NextResponse.json({ error: "User already a member" }, { status: 400 });

    // Create the membership
    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId,
        role,
        status: "ACTIVE",
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

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}