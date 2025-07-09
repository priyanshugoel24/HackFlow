import Ably from 'ably';

// Client-side Ably instance
let clientAbly: Ably.Realtime | null = null;
let currentClientId: string | null = null;

export function getAblyClient(clientId?: string): Ably.Realtime {
  // If clientId is provided and different from current, create a new client
  if (clientId && clientId !== currentClientId) {
    if (clientAbly) {
      console.log("🔄 Closing existing Ably client and creating new one with clientId:", clientId);
      clientAbly.close();
    }
    clientAbly = null;
    currentClientId = clientId;
  }

  if (!clientAbly) {
    const ablyKey = process.env.NEXT_PUBLIC_ABLY_CLIENT_KEY;
    if (!ablyKey) {
      throw new Error('NEXT_PUBLIC_ABLY_CLIENT_KEY is not set');
    }
    
    console.log("🔌 Creating new Ably client with clientId:", currentClientId);
    
    clientAbly = new Ably.Realtime({
      key: ablyKey,
      clientId: currentClientId || undefined,
      autoConnect: true,
      disconnectedRetryTimeout: 3000,
      suspendedRetryTimeout: 5000,
      httpRequestTimeout: 15000,
      closeOnUnload: true,
      useBinaryProtocol: false,
    });

    // Log connection events for debugging
    clientAbly.connection.on('connected', () => {
      console.log("✅ Ably client connected successfully - clientId:", clientAbly?.auth.clientId);
    });

    clientAbly.connection.on('connecting', () => {
      console.log("🔄 Ably client connecting...");
    });

    clientAbly.connection.on('disconnected', () => {
      console.log("❌ Ably client disconnected");
    });

    clientAbly.connection.on('suspended', () => {
      console.log("⏸️ Ably client suspended");
    });

    clientAbly.connection.on('failed', (error) => {
      console.error("❌ Ably connection failed:", error);
    });

    clientAbly.connection.on('update', (stateChange) => {
      console.log("🔄 Ably connection update:", stateChange);
    });
  }
  
  return clientAbly;
}

// Server-side Ably instance (for API routes)
let serverAbly: Ably.Rest | null = null;

export function getAblyServer(): Ably.Rest {
  if (!serverAbly) {
    const ablyKey = process.env.ABLY_SERVER_KEY;
    if (!ablyKey) {
      throw new Error('ABLY_SERVER_KEY is not set');
    }
    
    serverAbly = new Ably.Rest({
      key: ablyKey,
    });
  }
  
  return serverAbly;
}

// Channel names
export const CHANNELS = {
  PRESENCE_GLOBAL: 'presence:global',
  STATUS_UPDATES: 'status:updates',
  PROJECT_PRESENCE: (projectId: string) => `presence:project:${projectId}`,
} as const;

// Types for Ably presence data
export interface AblyPresenceData {
  name: string;
  image?: string;
  status?: string;
  lastSeen: string;
}

export interface AblyStatusData {
  userId: string;
  state: string;
  timestamp: string;
}
