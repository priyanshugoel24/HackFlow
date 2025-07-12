import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { email: token.email },
      data: { lastSeenat: new Date() },
    });

    return NextResponse.json({ message: "lastSeenat updated" });
  } catch (error) {
    console.error("Failed to update lastSeenat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}