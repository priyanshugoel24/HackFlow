"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient, CHANNELS, type AblyStatusData } from "@/lib/ably";
import type Ably from 'ably';

export type UserStatus = "Available" | "Busy" | "Focused" | "Away";

export function useAblyStatus() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<UserStatus>("Available");
  const [isConnected, setIsConnected] = useState(false);
  
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const statusChannelRef = useRef<Ably.RealtimeChannel | null>(null);

  // Update status both locally and via API
  const updateStatus = useCallback(async (newStatus: UserStatus) => {
    const user = session?.user as { id: string };
    if (!user?.id) return;

    try {
      // Update local state immediately
      setStatus(newStatus);
      
      // Update via API (which will also publish to Ably)
      const response = await fetch("/api/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: newStatus }),
      });

      if (response.ok) {
        console.log("✅ Status updated via API:", newStatus);
      } else {
        console.error("❌ Failed to update status via API");
        // Revert local state if API call failed
        setStatus(status);
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
      // Revert local state if there was an error
      setStatus(status);
    }
  }, [session?.user, status]);

  // Fetch initial status
  const fetchInitialStatus = useCallback(async () => {
    const user = session?.user as { id: string };
    if (!user?.id) return;

    try {
      const response = await fetch("/api/status");
      if (response.ok) {
        const data = await response.json();
        const initialStatus = data.status?.state || "Available";
        setStatus(initialStatus);
        console.log("📥 Fetched initial status:", initialStatus);
      }
    } catch (error) {
      console.error("❌ Error fetching initial status:", error);
    }
  }, [session?.user]);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((stateChange: Ably.ConnectionStateChange) => {
    console.log('🌐 Ably status connection state changed:', stateChange.current);
    setIsConnected(stateChange.current === 'connected');
  }, []);

  // Handle status updates from other users (and ourselves)
  const handleStatusMessage = useCallback((message: Ably.Message) => {
    const statusData = message.data as AblyStatusData;
    const user = session?.user as { id?: string };
    
    // Only update if it's our own status update
    if (statusData.userId === user?.id) {
      setStatus(statusData.state as UserStatus);
      console.log("📡 Received own status update via Ably:", statusData.state);
    }
  }, [session?.user]);

  // Main effect - initialize connection
  useEffect(() => {
    const user = session?.user as { id: string };
    if (!user?.id) {
      console.log("⏳ useAblyStatus waiting for session");
      setIsConnected(false);
      return;
    }

    console.log("🔌 Starting Ably status connection");
    
    try {
      const ably = getAblyClient(user.id);
      ablyRef.current = ably;
      
      const statusChannel = ably.channels.get(CHANNELS.STATUS_UPDATES);
      statusChannelRef.current = statusChannel;

      // Set up connection state listener
      ably.connection.on(handleConnectionStateChange);

      // Set up status message listener
      statusChannel.subscribe('status-update', handleStatusMessage);

      // Set initial connection state
      setIsConnected(ably.connection.state === 'connected');

      // Fetch initial status
      fetchInitialStatus();

    } catch (error) {
      console.error("❌ Failed to initialize Ably status:", error);
      setIsConnected(false);
    }

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up Ably status connection");
      
      if (ablyRef.current) {
        ablyRef.current.connection.off(handleConnectionStateChange);
      }
      
      if (statusChannelRef.current) {
        statusChannelRef.current.unsubscribe('status-update', handleStatusMessage);
      }
      
      setIsConnected(false);
    };
  }, [session?.user, handleConnectionStateChange, handleStatusMessage, fetchInitialStatus]);

  return {
    status,
    updateStatus,
    isConnected,
  };
}
