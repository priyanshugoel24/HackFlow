"use client";
import { useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient } from "@/lib/ably";
import type Ably from 'ably';

interface CardUpdate {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  updatedAt: string;
  userId: string;
  projectId: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

interface ActivityUpdate {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userId: string;
  projectId: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}

export function useProjectRealtime(
  projectId: string | null,
  onCardCreated?: (card: CardUpdate) => void,
  onCardUpdated?: (card: CardUpdate) => void,
  onCardDeleted?: (cardId: string) => void,
  onActivityCreated?: (activity: ActivityUpdate) => void
) {
  const { data: session } = useSession();
  const ablyRef = useRef<Ably.Realtime | null>(null);
  const channelRef = useRef<Ably.RealtimeChannel | null>(null);

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!projectId || !session?.user) return;

    const user = session.user as { id: string };
    if (!user.id) return;

    try {
      const ably = getAblyClient(user.id);
      ablyRef.current = ably;

      const channel = ably.channels.get(`project:${projectId}`);
      channelRef.current = channel;

      // Subscribe to card events
      channel.subscribe("card:created", (message: Ably.Message) => {
        console.log("📡 Received card:created:", message.data);
        onCardCreated?.(message.data);
      });

      channel.subscribe("card:updated", (message: Ably.Message) => {
        console.log("📡 Received card:updated:", message.data);
        onCardUpdated?.(message.data);
      });

      channel.subscribe("card:deleted", (message: Ably.Message) => {
        console.log("📡 Received card:deleted:", message.data);
        onCardDeleted?.(message.data.cardId);
      });

      channel.subscribe("activity:created", (message: Ably.Message) => {
        console.log("📡 Received activity:created:", message.data);
        onActivityCreated?.(message.data);
      });

      console.log("✅ Set up real-time subscriptions for project:", projectId);
    } catch (error) {
      console.error("❌ Failed to setup real-time subscriptions:", error);
    }
  }, [projectId, session?.user, onCardCreated, onCardUpdated, onCardDeleted, onActivityCreated]);

  useEffect(() => {
    setupRealtimeSubscriptions();

    return () => {
      console.log("🧹 Cleaning up project real-time subscriptions");
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      ablyRef.current = null;
    };
  }, [setupRealtimeSubscriptions]);

  return {
    isConnected: ablyRef.current?.connection.state === 'connected',
  };
}
