"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient, CHANNELS, type AblyStatusData } from "@/lib/ably";
import type Ably from 'ably';

export type UserStatus = "Available" | "Busy" | "Focused" | "Away";

export function useAblyStatus() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<UserStatus>("Available");
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<Ably.RealtimeChannel | null>(null);

  // Update status both locally and via API
  const updateStatus = useCallback(async (newStatus: UserStatus) => {
    if (!session?.user?.id) return;

    try {
      // Update via API (which will also publish to Ably)
      const response = await fetch("/api/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus);
        console.log("✅ Status updated:", newStatus);
      } else {
        console.error("❌ Failed to update status via API");
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
    }
  }, [session?.user?.id]);

  // Fetch initial status
  const fetchInitialStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status?.state || "Available");
        console.log("📥 Fetched initial status:", data.status?.state || "Available");
      }
    } catch (error) {
      console.error("❌ Error fetching initial status:", error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) {
      console.log("⏳ useAblyStatus waiting for session");
      return;
    }

    console.log("🔌 Starting Ably status connection");
    
    const ably = getAblyClient(session.user.id);
    const statusChannel = ably.channels.get(CHANNELS.STATUS_UPDATES);
    setChannel(statusChannel);

    // Handle connection state changes
    const handleConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      console.log('🌐 Ably status connection state changed:', stateChange.current);
      setIsConnected(stateChange.current === 'connected');
    };

    // Handle status updates from other users (and ourselves)
    const handleStatusMessage = (message: Ably.Message) => {
      const statusData = message.data as AblyStatusData;
      
      // Only update if it's our own status update
      if (statusData.userId === session.user.id) {
        setStatus(statusData.state as UserStatus);
        console.log("📡 Received status update via Ably:", statusData.state);
      }
    };

    // Subscribe to connection state changes
    ably.connection.on(handleConnectionStateChange);

    // Subscribe to status updates
    statusChannel.subscribe('status-update', handleStatusMessage);

    // Fetch initial status
    fetchInitialStatus();

    // Cleanup function
    return () => {
      console.log("🔇 Cleaning up Ably status connection");
      ably.connection.off(handleConnectionStateChange);
      statusChannel.unsubscribe('status-update', handleStatusMessage);
      setChannel(null);
      setIsConnected(false);
    };
  }, [session?.user?.id, fetchInitialStatus]);

  return {
    status,
    updateStatus,
    isConnected,
  };
}
