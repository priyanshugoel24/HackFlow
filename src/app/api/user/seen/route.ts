import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);

    await prisma.user.update({
      where: { email: user.email },
      data: { lastSeenat: new Date() },
    });

    return NextResponse.json({ message: "lastSeenat updated" });
  } catch (error) {
    if (error instanceof Error && error.message === 'No authenticated user found') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to update lastSeenat:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}