"use client";
import { useEffect, useState } from "react";
import { getAblyClient } from "../ably";
import { channelsConfig } from '@/config/channels';
import type * as Ably from 'ably';
import { EditingUser } from "@/interfaces/EditingUser";

export function useCardPresence(cardId: string, user: EditingUser) {
  const [editors, setEditors] = useState<EditingUser[]>([]);
  
  useEffect(() => {
    // Don't initialize if user is anonymous/invalid
    if (!user.id || user.id === "anonymous") {
      return;
    }
    
    const client = getAblyClient(user.id);
    if (!client) {
      console.error("Ably client is not initialized");
      return;
    }
    
    const channel = client.channels.get(channelsConfig.CARD_PRESENCE(cardId));

    const handleUserEditing = (msg: Ably.Message) => {
      console.log("📝 User started editing:", msg.data);
      setEditors((prev) => {
        const existing = prev.find((u) => u.id === msg.data.id);
        if (existing) return prev;
        return [...prev, msg.data];
      });
    };

    const handleUserStopped = (msg: Ably.Message) => {
      console.log("🛑 User stopped editing:", msg.data);
      setEditors((prev) => prev.filter((u) => u.id !== msg.data.id));
    };

    // Subscribe to events
    channel.subscribe("user:editing", handleUserEditing);
    channel.subscribe("user:stopped_editing", handleUserStopped);

    // Publish that current user started editing
    const publishTimer = setTimeout(() => {
      channel.publish("user:editing", user).catch((error) => {
        console.error("Failed to publish user:editing:", error);
      });
    }, 100);

    return () => {
      clearTimeout(publishTimer);
      
      // Unsubscribe and notify others
      channel.unsubscribe("user:editing", handleUserEditing);
      channel.unsubscribe("user:stopped_editing", handleUserStopped);
      
      // Notify that user stopped editing
      channel.publish("user:stopped_editing", user).catch(() => {
        // Ignore cleanup errors
      });
    };
  }, [cardId, user.id, user.name, user.image]);

  return { editors };
}