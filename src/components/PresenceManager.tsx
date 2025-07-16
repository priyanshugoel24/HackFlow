"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { usePresenceStore } from "@/lib/store";
import { useAblyPresence } from "@/lib/ably/useAblyPresence";

export default function PresenceManager() {
  const { data: session } = useSession();
  // Initialize Ably connection
  useAblyPresence();
  
  const { onlineUsers, isConnected } = usePresenceStore();

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    const user = session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
    if (!user.id) {
      return;
    }

    console.log("✅ PresenceManager initialized for user:", user.name);
    if (onlineUsers) {
      console.log("👥 Current online users:", onlineUsers.length);
    }
    console.log("🔌 Connection status:", isConnected);
    
  }, [session, onlineUsers, isConnected]);

  return null;
}