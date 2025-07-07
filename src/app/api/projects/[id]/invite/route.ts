import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { email, role = "MEMBER" } = await req.json();
  const projectId = params.id;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await prisma.projectMember.findFirst({
      where: { userId: user.id, projectId }
    });

    if (existing) return NextResponse.json({ error: "User already a member" }, { status: 400 });

    const member = await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId,
        role,
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}