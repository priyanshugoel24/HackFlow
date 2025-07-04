import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// GET: Get context cards for a specific project
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First verify the project exists and user has access (creator or member)
    const project = await prisma.project.findFirst({
      where: {
        id,
        OR: [
          { createdById: token.sub },
          { 
            members: {
              some: {
                userId: token.sub,
                status: "ACTIVE"
              }
            }
          }
        ],
        isArchived: false,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    // Get context cards for this project
    const contextCards = await prisma.contextCard.findMany({
      where: {
        userId: token.sub,
        projectId: id,
        isArchived: false,
      },
      include: {
        linkedCard: {
          select: {
            id: true,
            title: true,
          },
        },
        linkedFrom: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ contextCards });
  } catch (error) {
    console.error("Error fetching context cards:", error);
    return NextResponse.json({ error: "Failed to fetch context cards" }, { status: 500 });
  }
}
