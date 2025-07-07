"use client";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function PresenceManager() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) {
      console.log("⏳ PresenceManager waiting for session");
      return;
    }

    console.log("✅ PresenceManager initialized for user:", session.user.name);
    
    // The presence is now handled by the usePresence hook
    // This component is just for initialization and cleanup
    
  }, [session]);

  return null;
}