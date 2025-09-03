import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getAblyServer, CHANNELS, type AblyStatusData } from "@/lib/ably";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET
    });

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

    const status = await prisma.status.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ status: status || { state: "Available" } });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET
    });

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

    const { state } = await req.json();

    if (!state || typeof state !== "string") {
      return NextResponse.json({ error: "Invalid state" }, { status: 400 });
    }

    const updated = await prisma.status.upsert({
      where: { userId: user.id },
      update: { state },
      create: {
        state,
        userId: user.id,
      },
    });

    // Publish status update to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(CHANNELS.STATUS_UPDATES);
      
      const statusData: AblyStatusData = {
        userId: user.id,
        state,
        timestamp: new Date().toISOString(),
      };

      await channel.publish('status-update', statusData);
      console.log("📡 Published status update to Ably:", statusData);
    } catch (ablyError) {
      console.error("❌ Failed to publish status to Ably:", ablyError);
      // Don't fail the entire request if Ably publish fails
    }

    return NextResponse.json({ status: updated });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}