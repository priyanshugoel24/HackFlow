'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { getAblyClient } from '@/lib/ably/ably';
import Ably from 'ably';

interface RealtimeContextType {
  ably: Ably.Realtime | null;
  isConnected: boolean;
  connectionState: string;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [ably, setAbly] = useState<Ably.Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');

  useEffect(() => {
    if (!session?.user) {
      setAbly(null);
      setIsConnected(false);
      setConnectionState('disconnected');
      return;
    }

    const ablyClient = getAblyClient((session.user as { id: string }).id);
    setAbly(ablyClient);

    const updateConnectionState = () => {
      const state = ablyClient.connection.state;
      setConnectionState(state);
      setIsConnected(state === 'connected');
    };

    // Listen to connection state changes
    ablyClient.connection.on('connected', updateConnectionState);
    ablyClient.connection.on('disconnected', updateConnectionState);
    ablyClient.connection.on('connecting', updateConnectionState);
    ablyClient.connection.on('failed', updateConnectionState);

    // Initial state
    updateConnectionState();

    return () => {
      ablyClient.connection.off('connected', updateConnectionState);
      ablyClient.connection.off('disconnected', updateConnectionState);
      ablyClient.connection.off('connecting', updateConnectionState);
      ablyClient.connection.off('failed', updateConnectionState);
    };
  }, [session]);

  const value = {
    ably,
    isConnected,
    connectionState,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
