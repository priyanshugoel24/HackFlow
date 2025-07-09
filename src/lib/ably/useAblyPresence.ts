"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient, CHANNELS, type AblyPresenceData } from "@/lib/ably";
import type Ably from 'ably';

export type PresenceUser = {
  id: string;
  name: string;
  image?: string;
  status?: string;
  lastSeen: string;
};

export function useAblyPresence() {
  const { data: session } = useSession();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Available");
  
  // Use refs to avoid stale closures
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const presenceChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const hasEnteredPresence = useRef(false);

  // Convert Ably presence members to our format
  const convertPresenceMembers = useCallback((members: Ably.PresenceMessage[]): PresenceUser[] => {
    const userMap = new Map<string, PresenceUser>();
    
    members.forEach((member) => {
      if (!member.clientId) return;
      
      const data = member.data as AblyPresenceData;
      if (!data) return;
      
      const user: PresenceUser = {
        id: member.clientId,
        name: data.name || "Unknown User",
        image: data.image,
        status: data.status || "Available",
        lastSeen: data.lastSeen || new Date().toISOString(),
      };
      
      userMap.set(member.clientId, user);
    });
    
    return Array.from(userMap.values());
  }, []);

  // Update presence members from channel
  const updatePresenceMembers = useCallback(async () => {
    if (!presenceChannelRef.current) return;
    
    try {
      const members = await presenceChannelRef.current.presence.get();
      const users = convertPresenceMembers(members || []);
      setOnlineUsers(users);
      console.log("👥 Updated presence members:", users.length);
    } catch (error) {
      console.error("❌ Failed to get presence members:", error);
    }
  }, [convertPresenceMembers]);

  // Enter presence with current user data
  const enterPresence = useCallback(async () => {
    if (!presenceChannelRef.current || !session?.user) return;
    
    const user = session.user as { id: string; name?: string | null; image?: string | null };
    if (!user.id) return;

    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptEnterPresence = async (): Promise<void> => {
      try {
        const presenceData: AblyPresenceData = {
          name: user.name || "Unknown User",
          image: user.image || undefined,
          status: currentStatus,
          lastSeen: new Date().toISOString(),
        };

        await presenceChannelRef.current!.presence.enter(presenceData);
        hasEnteredPresence.current = true;
        console.log("✅ Entered presence:", presenceData);
        
        // Update presence members after entering
        await updatePresenceMembers();
      } catch (error) {
        console.error("❌ Failed to enter presence:", error);
        hasEnteredPresence.current = false;
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 Retrying presence entry (${retryCount}/${maxRetries})...`);
          setTimeout(attemptEnterPresence, 1000 * retryCount);
        } else {
          console.error("❌ Max retries reached for presence entry");
        }
      }
    };
    
    await attemptEnterPresence();
  }, [session?.user, currentStatus, updatePresenceMembers]);

  // Update presence data
  const updatePresence = useCallback(async (data: Partial<AblyPresenceData>) => {
    if (!presenceChannelRef.current || !session?.user) return;

    const user = session.user as { id: string; name?: string | null; image?: string | null };
    if (!user.id) return;

    try {
      const presenceData: AblyPresenceData = {
        name: user.name || "Unknown User",
        image: user.image || undefined,
        status: currentStatus,
        lastSeen: new Date().toISOString(),
        ...data,
      };

      if (hasEnteredPresence.current) {
        await presenceChannelRef.current.presence.update(presenceData);
        console.log("🔄 Updated presence:", presenceData);
      } else {
        await presenceChannelRef.current.presence.enter(presenceData);
        hasEnteredPresence.current = true;
        console.log("✅ Entered presence (via update):", presenceData);
      }
      
      // Update presence members after updating
      await updatePresenceMembers();
    } catch (error) {
      console.error("❌ Failed to update presence:", error);
    }
  }, [session?.user, currentStatus, updatePresenceMembers]);

  // Handle connection state changes
  const handleConnectionStateChange = useCallback((stateChange: Ably.ConnectionStateChange) => {
    console.log('🌐 Ably connection state changed:', stateChange.current);
    const connected = stateChange.current === 'connected';
    setIsConnected(connected);
    
    if (connected) {
      // Enter presence when connected
      if (!hasEnteredPresence.current) {
        enterPresence();
      }
    } else {
      // Clear online users when disconnected
      setOnlineUsers([]);
      hasEnteredPresence.current = false;
    }        // Handle failed states and CSP errors
        if (stateChange.current === 'failed') {
          console.error("❌ Ably connection failed:", stateChange.reason);
          setIsConnected(false);
          setOnlineUsers([]);
          hasEnteredPresence.current = false;
          
          // Check if this is a CSP-related error
          if (stateChange.reason && stateChange.reason.message && 
              stateChange.reason.message.includes('violates the following Content Security Policy')) {
            console.error("❌ CSP violation detected. Please check your CSP settings.");
            // Don't retry CSP errors immediately - they need configuration changes
            return;
          }
          
          // Try to reconnect after a delay for other types of errors
          setTimeout(() => {
            console.log("🔄 Attempting to reconnect...");
            if (ablyRef.current) {
              ablyRef.current.connect();
            }
          }, 5000);
        }
  }, [enterPresence]);

  // Handle presence events
  const handlePresenceEvent = useCallback((presenceMessage: Ably.PresenceMessage) => {
    console.log("🔄 Presence event:", presenceMessage.action, presenceMessage.clientId);
    updatePresenceMembers();
  }, [updatePresenceMembers]);

  // Main effect - initialize connection
  useEffect(() => {
    if (!session?.user) {
      console.log("⏳ Waiting for session...");
      setIsConnected(false);
      setOnlineUsers([]);
      return;
    }

    const user = session.user as { id: string; name?: string | null };
    if (!user.id) {
      console.log("⏳ Waiting for user id...");
      return;
    }

    console.log("🔌 Initializing Ably presence for user:", user.name);
    
    let mounted = true;
    
    const initializePresence = async () => {
      try {
        // Check if environment variables are set
        if (!process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY) {
          console.error("❌ NEXT_PUBLIC_ABLY_CLIENT_KEY is not set");
          return;
        }
        
        // Initialize Ably client
        const ably = getAblyClient(user.id);
        if (!mounted) return;
        
        ablyRef.current = ably;
        
        // Get presence channel
        const presenceChannel = ably.channels.get(CHANNELS.PRESENCE_GLOBAL);
        presenceChannelRef.current = presenceChannel;
        
        // Set up connection state listener
        ably.connection.on(handleConnectionStateChange);
        
        // Set up presence event listeners with retry logic
        const subscribeToPresence = async (retryCount = 0) => {
          try {
            presenceChannel.presence.subscribe(['enter', 'update', 'leave'], handlePresenceEvent);
            console.log("✅ Subscribed to presence events");
          } catch (error) {
            console.error("❌ Failed to subscribe to presence events:", error);
            
            // Retry subscription up to 3 times
            if (retryCount < 3) {
              console.log(`🔄 Retrying presence subscription (${retryCount + 1}/3)...`);
              setTimeout(() => subscribeToPresence(retryCount + 1), 2000 * (retryCount + 1));
            }
          }
        };
        
        await subscribeToPresence();
        
        // Set initial connection state
        const initialState = ably.connection.state;
        if (mounted) {
          setIsConnected(initialState === 'connected');
          console.log("🔌 Initial connection state:", initialState);
        }
        
        // Enter presence if already connected
        if (initialState === 'connected' && mounted) {
          enterPresence();
        }
        
      } catch (error) {
        console.error("❌ Failed to initialize Ably presence:", error);
        if (mounted) {
          setIsConnected(false);
          setOnlineUsers([]);
        }
      }
    };
    
    initializePresence();

    // Cleanup function
    return () => {
      mounted = false;
      console.log("🧹 Cleaning up Ably presence");
      
      // Leave presence and clean up
      if (presenceChannelRef.current && hasEnteredPresence.current) {
        presenceChannelRef.current.presence.leave().catch(err => 
          console.warn("⚠️ Error leaving presence:", err)
        );
      }
      
      // Remove listeners
      if (ablyRef.current) {
        ablyRef.current.connection.off(handleConnectionStateChange);
      }
      
      if (presenceChannelRef.current) {
        presenceChannelRef.current.presence.unsubscribe();
      }
      
      // Reset state
      hasEnteredPresence.current = false;
      setIsConnected(false);
      setOnlineUsers([]);
    };
  }, [session?.user, handleConnectionStateChange, handlePresenceEvent, enterPresence]);

  // Update status
  const updateStatus = useCallback((newStatus: string) => {
    setCurrentStatus(newStatus);
    updatePresence({ status: newStatus });
  }, [updatePresence]);

  return {
    onlineUsers,
    isConnected,
    updatePresence,
    updateStatus,
    currentStatus,
  };
}
