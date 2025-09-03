import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";

// GET /api/invitations - Get pending invitations for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    const pendingTeamInvitations = await prisma.teamMember.findMany({
      where: {
        OR: [
          {
            userId: user.id,
            status: "INVITED",
          },
          {
            user: {
              email: user.email,
            },
            status: "INVITED",
          },
        ],
        team: {
          isArchived: false,
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            createdAt: true,
            lastActivityAt: true,
          },
        },
        addedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });    

    return NextResponse.json({ 
      teamInvitations: pendingTeamInvitations
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'No authenticated user found') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching pending invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}
