"use client";
import { usePresence } from "@/lib/socket/usePresence";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function PresenceManager() {
  const { data: session } = useSession();
  const { onlineUsers, isConnected } = usePresence();

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const user = session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
    if (!user.id) {
      return;
    }

    console.log("✅ PresenceManager initialized for user:", user.name);
    console.log("👥 Current online users:", onlineUsers.length);
    console.log("🔌 Connection status:", isConnected);
    
  }, [session, onlineUsers.length, isConnected]);

  return null;
}