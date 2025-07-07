import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAblyServer, CHANNELS } from "@/lib/ably";

// In-memory store for online users (in production, use Redis)
const onlineUsers = new Map<string, { name: string; image?: string; lastSeen: Date }>();

// Clean up old users (older than 30 seconds)
const cleanupOldUsers = () => {
  const now = new Date();
  for (const [userId, user] of onlineUsers.entries()) {
    if (now.getTime() - user.lastSeen.getTime() > 30000) {
      onlineUsers.delete(userId);
    }
  }
};

// GET: Get current online users (legacy endpoint for backward compatibility)
export async function GET(req: NextRequest) {
  cleanupOldUsers();
  
  return NextResponse.json({
    users: Array.from(onlineUsers.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      image: info.image,
    })),
  });
}

// POST: Update user presence (legacy endpoint - Ably handles this now)
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name, image } = await req.json();
  
  // Update user presence in memory (for legacy support)
  onlineUsers.set(token.sub, {
    name: name || token.name || "Unknown User",
    image: image || token.picture,
    lastSeen: new Date(),
  });

  cleanupOldUsers();

  // No need to publish to Ably here - presence is handled by Ably's presence system
  console.log("📡 Legacy presence update for user:", token.sub);

  return NextResponse.json({
    success: true,
    users: Array.from(onlineUsers.entries()).map(([id, info]) => ({
      id,
      name: info.name,
      image: info.image,
    })),
  });
}