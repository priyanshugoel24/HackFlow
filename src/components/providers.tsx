'use client';

import { SessionProvider } from 'next-auth/react';
import { StatusProvider } from './StatusProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StatusProvider>
        
          {children}
      </StatusProvider>
    </SessionProvider>
  );
}