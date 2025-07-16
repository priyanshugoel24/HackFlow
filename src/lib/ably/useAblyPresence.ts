"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient, CHANNELS, type AblyPresenceData } from "@/lib/ably";
import type Ably from 'ably';
import axios from "axios";

export type UserStatus = "Available" | "Busy" | "Focused";

export type PresenceUser = {
  id: string;
  name: string;
  image?: string;
  status: UserStatus;
  lastSeen: string;
};

export function useAblyPresence() {
  const { data: session, status: sessionStatus } = useSession();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<UserStatus>("Available");
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);
  const presenceRef = useRef<Ably.RealtimePresence | null>(null);

  // Convert Ably presence members to our PresenceUser format
  const convertPresenceMembers = useCallback((members: Ably.PresenceMessage[]) => {
    return members
      .map(member => {
        const data = member.data as AblyPresenceData;
        const presenceEmail = data?.email || '';
        return {
          id: presenceEmail,
          name: data?.name || presenceEmail.split('@')[0] || 'User',
          image: data?.image,
          status: (data?.status as UserStatus) || 'Available',
          lastSeen: data?.lastSeen || new Date().toISOString(),
        } as PresenceUser;
      });
  }, []);

  // Get current presence members
  const updatePresenceMembers = useCallback(async () => {
    if (!presenceRef.current) return;
    
    try {
      const members = await presenceRef.current.get();
      const users = convertPresenceMembers(members);
      setOnlineUsers(users);
      console.log("👥 Updated presence members:", users.length);
    } catch (error) {
      console.error("❌ Failed to get presence members:", error);
    }
  }, [convertPresenceMembers]);

  // Handle presence events for real-time updates
  const handlePresenceEvent = useCallback((presenceMessage: Ably.PresenceMessage) => {
    console.log("🔄 Presence event:", presenceMessage.action, presenceMessage.clientId);

    const user = session?.user as { email?: string };

    const data = presenceMessage.data as AblyPresenceData;
    const presenceEmail = data?.email;

    // No longer ignoring updates from the current user
    // if (presenceEmail === user?.email) {
    //   return;
    // }

    if ((presenceMessage.action === 'enter' || presenceMessage.action === 'update') && presenceEmail) {
      const newUser: PresenceUser = {
        id: presenceEmail,
        name: data.name || presenceEmail.split('@')[0] || "User",
        image: data.image,
        status: (data.status as UserStatus) || "Available",
        lastSeen: data.lastSeen || new Date().toISOString(),
      };

      setOnlineUsers(prevUsers => {
        const existingIndex = prevUsers.findIndex(u => u.id === newUser.id);
        if (existingIndex >= 0) {
          const updatedUsers = [...prevUsers];
          updatedUsers[existingIndex] = newUser;
          return updatedUsers;
        } else {
          return [...prevUsers, newUser];
        }
      });
    } else if (presenceMessage.action === 'leave' && presenceEmail) {
      setOnlineUsers(prevUsers => prevUsers.filter(u => u.id !== presenceEmail));
    }
  }, [session?.user, convertPresenceMembers, updatePresenceMembers]);

  // Update user status
  const updateStatus = useCallback(async (newStatus: UserStatus): Promise<void> => {
    const user = session?.user as { id: string; name?: string; email?: string; image?: string };
    if (!user?.id || !presenceRef.current) return;

    try {
      console.log("� Updating status to:", newStatus);
      
      // Update local state immediately for UI responsiveness
      setCurrentStatus(newStatus);

      // Update presence data with new status
      const presenceData: AblyPresenceData = {
        name: user.name || user.email?.split('@')[0] || "User",
        email: user.email || "",
        image: user.image,
        status: newStatus,
        lastSeen: new Date().toISOString(),
      };

      // Update presence (this will trigger presence events for other users)
      await presenceRef.current.update(presenceData);

      // Manually update the local state to reflect the change immediately
      setOnlineUsers(prevUsers => {
        const updatedUsers = [...prevUsers];
        const userIndex = updatedUsers.findIndex(u => u.id === user.email);
        if (userIndex !== -1) {
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            status: newStatus,
            lastSeen: presenceData.lastSeen,
          };
        }
        return updatedUsers;
      });

      // Also persist to database
      await axios.post("/api/status", { state: newStatus });

      console.log("✅ Status updated successfully:", newStatus);
    } catch (error) {
      console.error("❌ Failed to update status:", error);
      // Revert local state on error
      setCurrentStatus(currentStatus);
      throw error;
    }
  }, [session?.user, currentStatus]);

  // Fetch initial status from API
  const fetchInitialStatus = useCallback(async () => {
    const user = session?.user as { id: string };
    if (!user?.id) return;

    try {
      const response = await axios.get("/api/status");
      const initialStatus = response.data.status?.state || "Available";
      setCurrentStatus(initialStatus as UserStatus);
      console.log("📥 Fetched initial status:", initialStatus);
    } catch (error) {
      console.error("❌ Error fetching initial status:", error);
    }
  }, [session?.user]);

  // Enter presence with user data
  const enterPresence = useCallback(async () => {
    const user = session?.user as { id: string; name?: string; email?: string; image?: string };
    if (!user?.id || !channelRef.current) return;

    try {
      const presenceData: AblyPresenceData = {
        name: user.name || user.email?.split('@')[0] || "User",
        email: user.email || "",
        image: user.image,
        status: currentStatus,
        lastSeen: new Date().toISOString(),
      };

      await channelRef.current.presence.enter(presenceData);
      console.log("✅ Entered presence with data:", presenceData);
    } catch (error) {
      console.error("❌ Failed to enter presence:", error);
    }
  }, [session?.user, currentStatus]);

  // Leave presence
  const leavePresence = useCallback(async () => {
    if (!channelRef.current) return;

    try {
      await channelRef.current.presence.leave();
      console.log("✅ Left presence");
    } catch (error) {
      console.error("❌ Failed to leave presence:", error);
    }
  }, []);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((stateChange: Ably.ConnectionStateChange) => {
    console.log("🔗 Connection state changed:", stateChange.current);
    setIsConnected(stateChange.current === 'connected');
    
    if (stateChange.current === 'connected') {
      // Retry entering presence after reconnection
      setTimeout(() => {
        enterPresence();
      }, 1000);
    }
  }, [enterPresence]);

  // Initialize Ably connection and presence
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !session?.user) {
      setIsConnected(false);
      return;
    }

    const initializeAbly = async () => {
      try {
        console.log("🚀 Initializing Ably presence...");
        
        const user = session.user as { id: string };
        const client = getAblyClient(user.id);
        const channel = client.channels.get(CHANNELS.PRESENCE_GLOBAL);
        
        channelRef.current = channel;
        presenceRef.current = channel.presence;

        // Set up event listeners
        channel.presence.subscribe(['enter', 'leave', 'update'], handlePresenceEvent);
        client.connection.on(handleConnectionStateChange);

        // Set initial connection state
        setIsConnected(client.connection.state === 'connected');

        // Fetch initial status and enter presence
        await fetchInitialStatus();
        await enterPresence();
        await updatePresenceMembers();

        console.log("✅ Ably presence initialized successfully");

      } catch (error) {
        console.error("❌ Failed to initialize Ably presence:", error);
        setIsConnected(false);
      }
    };

    initializeAbly();

    // Cleanup on unmount
    return () => {
      const client = getAblyClient();
      if (client.connection) {
        client.connection.off(handleConnectionStateChange);
      }
      
      leavePresence();
      
      if (channelRef.current) {
        channelRef.current.presence.unsubscribe();
        channelRef.current = null;
      }
      
      presenceRef.current = null;
      setIsConnected(false);
    };
  }, [
    sessionStatus,
    session?.user,
    handlePresenceEvent,
    handleConnectionStateChange,
    fetchInitialStatus,
    enterPresence,
    updatePresenceMembers,
    leavePresence
  ]);

  return {
    onlineUsers,
    isConnected,
    currentStatus,
    updateStatus,
  };
}
