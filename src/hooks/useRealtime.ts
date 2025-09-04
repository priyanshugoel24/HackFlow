import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getAblyClient } from '@/lib/ably/ably';
import { RealtimeChannel } from 'ably';
import type { InboundMessage } from 'ably';

export function useRealtime(channelName: string, eventName: string, callback: (message: InboundMessage) => void) {
  const { data: session } = useSession();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!session?.user || !channelName) return;

    const ably = getAblyClient((session.user as { id: string }).id);
    const channel = ably.channels.get(channelName);
    channelRef.current = channel;

    channel.subscribe(eventName, callback);

    return () => {
      channel.unsubscribe(eventName, callback);
      
      // detach the channel
      const cleanupChannel = async () => {
        try {
          if (channel.state === 'attached') {
            await channel.detach();
          }
        } catch (error) {
          console.error('Error detaching Ably channel:', error);
        }
      };
      
      cleanupChannel();
    };
  }, [channelName, eventName, callback, session]);

  const publish = (eventName: string, data: unknown) => {
    if (channelRef.current) {
      channelRef.current.publish(eventName, data);
    }
  };

  return { publish };
}
