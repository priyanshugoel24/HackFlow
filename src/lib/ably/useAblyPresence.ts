"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient, CHANNELS, type AblyPresenceData, type AblyStatusData } from "@/lib/ably";
import type Ably from 'ably';

type PresenceUser = {
  id: string;
  name: string;
  image?: string;
  status?: string;
  lastSeen: string;
};

interface UseAblyPresenceOptions {
  initialStatus?: string;
}

export function useAblyPresence(options: UseAblyPresenceOptions = {}) {
  const { data: session } = useSession();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [presenceChannel, setPresenceChannel] = useState<Ably.RealtimeChannel | null>(null);
  const [statusChannel, setStatusChannel] = useState<Ably.RealtimeChannel | null>(null);
  const [currentStatus, setCurrentStatus] = useState(options.initialStatus || "Available");

  // Convert Ably presence members to our PresenceUser format
  const convertPresenceMembers = useCallback((members: Ably.PresenceMessage[]): PresenceUser[] => {
    console.log("🔄 Converting presence members:", members.map(m => ({ 
      clientId: m.clientId, 
      status: (m.data as AblyPresenceData)?.status,
      name: (m.data as AblyPresenceData)?.name 
    })));
    
    return members.map((member) => {
      const data = member.data as AblyPresenceData;
      return {
        id: member.clientId!,
        name: data.name,
        image: data.image,
        status: data.status,
        lastSeen: data.lastSeen,
      };
    });
  }, []);

  // Update presence data for current user
  const updatePresence = useCallback(async (presenceData: Partial<AblyPresenceData>) => {
    if (!presenceChannel || !session?.user?.id) {
      console.warn("⚠️ Cannot update presence: channel or session not available");
      return;
    }

    try {
      const currentData: AblyPresenceData = {
        name: session.user.name || "Unknown User",
        image: session.user.image || undefined,
        status: currentStatus,
        lastSeen: new Date().toISOString(),
        ...presenceData,
      };

      await presenceChannel.presence.update(currentData);
      console.log("🔄 Updated Ably presence:", currentData);
    } catch (error) {
      console.error("❌ Failed to update Ably presence:", error);
    }
  }, [presenceChannel, session?.user?.id, session?.user?.name, session?.user?.image, currentStatus]);

  // Update status and sync with presence
  const updateStatus = useCallback(async (newStatus: string) => {
    setCurrentStatus(newStatus);
    await updatePresence({ status: newStatus });
  }, [updatePresence]);

  useEffect(() => {
    if (!session?.user?.id) {
      console.log("⏳ useAblyPresence waiting for session");
      return;
    }

    console.log("🔌 Starting Ably presence connection");
    
    const ably = getAblyClient(session.user.id);
    
    const presenceChannelRef = ably.channels.get(CHANNELS.PRESENCE_GLOBAL);
    const statusChannelRef = ably.channels.get(CHANNELS.STATUS_UPDATES);
    
    setPresenceChannel(presenceChannelRef);
    setStatusChannel(statusChannelRef);

    // Enter presence function (defined inside useEffect to avoid stale closure)
    const enterPresence = async () => {
      try {
        console.log("🚪 Entering Ably presence...");
        
        const presenceData: AblyPresenceData = {
          name: session.user.name || "Unknown User",
          image: session.user.image || undefined,
          status: currentStatus,
          lastSeen: new Date().toISOString(),
        };

        await presenceChannelRef.presence.enter(presenceData);
        console.log("✅ Successfully entered Ably presence");
        
        // Get initial presence members after entering
        const members = await presenceChannelRef.presence.get();
        const users = convertPresenceMembers(members || []);
        console.log("👥 Initial presence members:", users);
        setOnlineUsers(users);
      } catch (error) {
        console.error("❌ Failed to enter presence:", error);
      }
    };

    // Handle connection state changes
    const handleConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
      console.log('🌐 Ably presence connection state changed:', stateChange.current);
      setIsConnected(stateChange.current === 'connected');
      
      // Try to enter presence when connected
      if (stateChange.current === 'connected') {
        enterPresence();
      }
    };

    // Handle presence updates
    const handlePresenceUpdate = async () => {
      try {
        const members = await presenceChannelRef.presence.get();
        const users = convertPresenceMembers(members || []);
        console.log("👥 Presence update, online users:", users);
        setOnlineUsers(users);
      } catch (err) {
        console.error("❌ Failed to get presence members:", err);
      }
    };

    // Handle status updates from the status channel
    const handleStatusUpdate = async (message: Ably.Message) => {
      const statusData = message.data as AblyStatusData;
      console.log("📡 Received status update:", statusData);
      
      // If it's our own status update, sync with presence
      if (statusData.userId === session.user.id) {
        console.log("🔄 Syncing own status with presence:", statusData.state);
        setCurrentStatus(statusData.state);
        
        // Update presence immediately with the new status
        try {
          const presenceData: AblyPresenceData = {
            name: session.user.name || "Unknown User",
            image: session.user.image || undefined,
            status: statusData.state,
            lastSeen: new Date().toISOString(),
          };

          await presenceChannelRef.presence.update(presenceData);
          console.log("✅ Updated presence with new status:", statusData.state);
        } catch (error) {
          console.error("❌ Failed to update presence with new status:", error);
        }
      }
      
      // Refresh presence to get updated status for all users
      handlePresenceUpdate();
    };

    // Subscribe to connection state changes
    ably.connection.on(handleConnectionStateChange);

    // Subscribe to presence events
    presenceChannelRef.presence.subscribe(['enter', 'update', 'leave'], (presenceMessage) => {
      console.log("🔄 Presence event:", presenceMessage.action, presenceMessage.clientId);
      handlePresenceUpdate();
    });

    // Subscribe to status updates
    statusChannelRef.subscribe('status-update', handleStatusUpdate);

    // Set initial connection state
    setIsConnected(ably.connection.state === 'connected');

    // Enter presence when ready
    if (ably.connection.state === 'connected') {
      enterPresence();
    } else {
      console.log("⏳ Waiting for Ably connection...", ably.connection.state);
      ably.connection.once('connected', enterPresence);
    }

    // Cleanup function
    return () => {
      console.log("🔇 Cleaning up Ably presence connection");
      ably.connection.off(handleConnectionStateChange);
      presenceChannelRef.presence.unsubscribe();
      presenceChannelRef.presence.leave().catch(err => 
        console.warn("⚠️ Error leaving presence:", err)
      );
      statusChannelRef.unsubscribe('status-update', handleStatusUpdate);
      setPresenceChannel(null);
      setStatusChannel(null);
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [session?.user?.id, session?.user?.name, session?.user?.image, currentStatus, convertPresenceMembers, updatePresence]);

  return { 
    onlineUsers, 
    isConnected, 
    updatePresence,
    updateStatus,
    currentStatus
  };
}
