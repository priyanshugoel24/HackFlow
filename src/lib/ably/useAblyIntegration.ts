"use client";
import { useEffect } from "react";
import { useAblyPresence } from "./useAblyPresence";
import { useAblyStatus } from "./useAblyStatus";

/**
 * Combined hook that integrates presence and status updates via Ably
 * This ensures that when status changes, presence is also updated
 */
export function useAblyIntegration() {
  const { status, updateStatus, isConnected: statusConnected } = useAblyStatus();
  const { 
    onlineUsers, 
    isConnected: presenceConnected, 
    updateStatus: updatePresenceStatus,
    currentStatus 
  } = useAblyPresence({ initialStatus: status });

  // Sync status changes with presence
  useEffect(() => {
    if (currentStatus !== status) {
      updatePresenceStatus(status);
    }
  }, [status, currentStatus, updatePresenceStatus]);

  return {
    // Status management
    status,
    updateStatus,
    
    // Presence management
    onlineUsers,
    
    // Connection status (both must be connected for full functionality)
    isConnected: statusConnected && presenceConnected,
    statusConnected,
    presenceConnected,
  };
}
