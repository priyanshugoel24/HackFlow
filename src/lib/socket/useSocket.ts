"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient } from "@/lib/ably";
import type Ably from 'ably';

export function useSocket() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("disconnected");
  const ablyRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    if (!session?.user?.id) {
      console.log("⏳ useSocket waiting for session");
      return;
    }

    console.log("🔌 Initializing Ably client connection");
    
    try {
      const ably = getAblyClient(session.user.id);
      ablyRef.current = ably;
      
      // Handle connection state changes
      const handleConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
        console.log('🌐 Ably connection state changed:', stateChange.current);
        setConnectionState(stateChange.current);
        setIsConnected(stateChange.current === 'connected');
      };

      // Subscribe to connection state changes
      ably.connection.on(handleConnectionStateChange);

      // Set initial state
      setConnectionState(ably.connection.state);
      setIsConnected(ably.connection.state === 'connected');

      // Cleanup function
      return () => {
        console.log("� Cleaning up Ably connection");
        ably.connection.off(handleConnectionStateChange);
        ablyRef.current = null;
        setIsConnected(false);
        setConnectionState("disconnected");
      };
    } catch (error) {
      console.error("❌ Failed to initialize Ably client:", error);
      setIsConnected(false);
      setConnectionState("failed");
    }
  }, [session?.user?.id]);

  return { 
    socket: ablyRef.current, 
    isConnected, 
    connectionState,
    ably: ablyRef.current 
  };
}