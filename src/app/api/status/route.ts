import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token?.sub) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const status = await prisma.status.findUnique({
      where: { userId: token.sub },
    });

    return NextResponse.json({ status: status || { state: "Available" } });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token?.sub) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { state } = await req.json();

    if (!state || typeof state !== "string") {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    const updated = await prisma.status.upsert({
      where: { userId: token.sub },
      update: { state },
      create: {
        state,
        userId: token.sub,
      },
    });

    return NextResponse.json({ status: updated });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}