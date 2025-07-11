import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// GET /api/invitations - Get pending invitations for the current user
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    console.log(`🔍 Fetching invitations for user: ${token.email}`);
    
    // First, ensure the user exists in the database
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

    const pendingInvitations = await prisma.projectMember.findMany({
      where: {
        OR: [
          {
            userId: user.id,
            status: "INVITED",
          },
          {
            user: {
              email: token.email,
            },
            status: "INVITED",
          },
        ],
        project: {
          isArchived: false,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            link: true,
            tags: true,
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

    console.log(`📨 Found ${pendingInvitations.length} pending invitations for user ${user.id}`);

    return NextResponse.json({ invitations: pendingInvitations });
  } catch (error) {
    console.error("Error fetching pending invitations:", error);
    return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
  }
}
