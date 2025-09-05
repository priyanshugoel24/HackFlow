// Provider component interfaces and types
import { ReactNode } from 'react';
import Ably from 'ably';

export interface AppProvidersProps {
  children: ReactNode;
}

export type Theme = 'dark' | 'light' | 'system';

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export interface RealtimeContextType {
  ably: Ably.Realtime | null;
  isConnected: boolean;
  connectionState: string;
}

export interface RealtimeProviderProps {
  children: ReactNode;
}
