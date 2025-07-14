"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient, CHANNELS, type AblyPresenceData, type AblyStatusData } from "@/lib/ably";
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
  const statusChannelRef = useRef<Ably.RealtimeChannel | null>(null);
  const hasEnteredPresence = useRef(false);
  const persistStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Convert Ably presence members to our format
  const convertPresenceMembers = useCallback((members: Ably.PresenceMessage[]): PresenceUser[] => {
    const userMap = new Map<string, PresenceUser>();
    
    members.forEach((member) => {
      if (!member.clientId) return;
      
      const data = member.data as AblyPresenceData;
      if (!data) return;
      
      const user: PresenceUser = {
        id: member.clientId,
        name: data.name || data.email?.split('@')[0] || "User",
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

  // Handle status updates from the status channel - for instant UI updates
  const handleStatusMessage = useCallback((message: Ably.Message) => {
    const statusData = message.data as AblyStatusData;
    const user = session?.user as { id?: string };
    
    console.log("📡 Received status update:", statusData);
    
    // Update for any user's status change (not just our own)
    if (statusData.userId === user?.id) {
      // Update our own status instantly
      console.log("⚡ Updating own status instantly:", statusData.state);
      setCurrentStatus(statusData.state);
    }
    
    // Update the online users list to reflect any user's status change
    setOnlineUsers(prevUsers => {
      return prevUsers.map(u => 
        u.id === statusData.userId 
          ? { ...u, status: statusData.state }
          : u
      );
    });
  }, [session?.user]);

  // Fetch initial status
  const fetchInitialStatus = useCallback(async () => {
    const user = session?.user as { id: string };
    if (!user?.id) return;

    try {
      const response = await fetch("/api/status");
      if (response.ok) {
        const data = await response.json();
        const initialStatus = data.status?.state || "Available";
        setCurrentStatus(initialStatus);
        console.log("📥 Fetched initial status:", initialStatus);
      }
    } catch (error) {
      console.error("❌ Error fetching initial status:", error);
    }
  }, [session?.user]);

  // Enter presence with current user data
  const enterPresence = useCallback(async () => {
    if (!presenceChannelRef.current || !session?.user) return;
    
    const user = session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
    if (!user.id) return;

    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptEnterPresence = async (): Promise<void> => {
      try {
        const presenceData: AblyPresenceData = {
          name: user.name || user.email?.split('@')[0] || "User",
          email: user.email || undefined,
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

    const user = session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
    if (!user.id) return;

    try {
      const presenceData: AblyPresenceData = {
        name: user.name || user.email?.split('@')[0] || "User",
        email: user.email || undefined,
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

  // Handle presence events with optimized updates
  const handlePresenceEvent = useCallback((presenceMessage: Ably.PresenceMessage) => {
    console.log("🔄 Presence event:", presenceMessage.action, presenceMessage.clientId);
    
    // Immediate optimistic update for better responsiveness
    if (presenceMessage.action === 'enter' || presenceMessage.action === 'update') {
      const data = presenceMessage.data as AblyPresenceData;
      if (data && presenceMessage.clientId) {
        const user: PresenceUser = {
          id: presenceMessage.clientId,
          name: data.name || data.email?.split('@')[0] || "User",
          image: data.image,
          status: data.status || "Available",
          lastSeen: data.lastSeen || new Date().toISOString(),
        };
        
        setOnlineUsers(prevUsers => {
          const existingIndex = prevUsers.findIndex(u => u.id === user.id);
          if (existingIndex >= 0) {
            // Update existing user
            const updatedUsers = [...prevUsers];
            updatedUsers[existingIndex] = user;
            return updatedUsers;
          } else {
            // Add new user
            return [...prevUsers, user];
          }
        });
      }
    } else if (presenceMessage.action === 'leave' && presenceMessage.clientId) {
      setOnlineUsers(prevUsers => prevUsers.filter(u => u.id !== presenceMessage.clientId));
    }
    
    // Also do a full refresh (but don't wait for it)
    setTimeout(() => updatePresenceMembers(), 100);
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
        
        // Get status channel
        const statusChannel = ably.channels.get(CHANNELS.STATUS_UPDATES);
        statusChannelRef.current = statusChannel;
        
        // Set up connection state listener
        ably.connection.on(handleConnectionStateChange);
        
        // Set up presence event listeners with immediate subscription
        const subscribeToPresence = () => {
          try {
            presenceChannel.presence.subscribe(['enter', 'update', 'leave'], handlePresenceEvent);
            console.log("✅ Subscribed to presence events");
          } catch (error) {
            console.error("❌ Failed to subscribe to presence events:", error);
          }
        };
        
        // Set up status message listeners with immediate subscription
        const subscribeToStatus = () => {
          try {
            statusChannel.subscribe('status-update', handleStatusMessage);
            console.log("✅ Subscribed to status updates");
          } catch (error) {
            console.error("❌ Failed to subscribe to status updates:", error);
          }
        };
        
        // Subscribe immediately - no awaiting for faster initialization
        subscribeToPresence();
        subscribeToStatus();
        
        // Fetch initial status in background (don't block)
        fetchInitialStatus();
        
        // Set initial connection state
        const initialState = ably.connection.state;
        if (mounted) {
          setIsConnected(initialState === 'connected');
          console.log("🔌 Initial connection state:", initialState);
        }
        
        // Enter presence if already connected (in background)
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
      
      if (statusChannelRef.current) {
        statusChannelRef.current.unsubscribe('status-update', handleStatusMessage);
      }
      
      // Reset state
      hasEnteredPresence.current = false;
      setIsConnected(false);
      setOnlineUsers([]);
      
      // Clear any pending status persistence
      if (persistStatusTimeoutRef.current) {
        clearTimeout(persistStatusTimeoutRef.current);
        persistStatusTimeoutRef.current = null;
      }
    };
  }, [session?.user, handleConnectionStateChange, handlePresenceEvent, handleStatusMessage, fetchInitialStatus, enterPresence]);

  // Update status with immediate local update and debounced persistence
  const updateStatus = useCallback(async (newStatus: string) => {
    const user = session?.user as { id: string };
    if (!user?.id) return;

    console.log("🚀 Updating status instantly:", newStatus);

    // 1. Update local state immediately for instant UI feedback
    setCurrentStatus(newStatus);
    
    // 2. Update online users list immediately (optimistic update)
    setOnlineUsers(prevUsers => {
      return prevUsers.map(u => 
        u.id === user.id 
          ? { ...u, status: newStatus }
          : u
      );
    });

    // 3. Broadcast status change via Ably for real-time updates to other users
    if (statusChannelRef.current) {
      try {
        const statusData: AblyStatusData = {
          userId: user.id,
          state: newStatus,
          timestamp: new Date().toISOString(),
        };
        
        // Publish immediately to Ably for real-time updates
        await statusChannelRef.current.publish('status-update', statusData);
        console.log("⚡ Status broadcasted via Ably instantly:", newStatus);
      } catch (error) {
        console.error("❌ Failed to broadcast status via Ably:", error);
      }
    }

    // 4. Update presence data (for presence-aware features)
    if (presenceChannelRef.current && hasEnteredPresence.current) {
      try {
        const user = session?.user as { name?: string | null; email?: string | null; image?: string | null };
        const presenceData: AblyPresenceData = {
          name: user?.name || user?.email?.split('@')[0] || "User",
          email: user?.email || undefined,
          image: user?.image || undefined,
          status: newStatus,
          lastSeen: new Date().toISOString(),
        };
        
        // Update presence immediately - non-blocking
        presenceChannelRef.current.presence.update(presenceData).catch(error => {
          console.warn("⚠️ Failed to update presence (non-critical):", error);
        });
      } catch (error) {
        console.warn("⚠️ Failed to update presence (non-critical):", error);
      }
    }

    // 5. Background database persistence (optional - doesn't block UI)
    if (persistStatusTimeoutRef.current) {
      clearTimeout(persistStatusTimeoutRef.current);
    }
    
    persistStatusTimeoutRef.current = setTimeout(() => {
      fetch("/api/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: newStatus }),
      }).then(response => {
        if (response.ok) {
          console.log("✅ Status persisted to database (background):", newStatus);
        } else {
          console.warn("⚠️ Failed to persist status to database (background)");
        }
      }).catch(error => {
        console.warn("⚠️ Error persisting status to database (background):", error);
      });
    }, 1000); // Longer debounce for background persistence
  }, [session?.user]);

  return {
    onlineUsers,
    isConnected,
    updatePresence,
    updateStatus,
    currentStatus,
  };
}
