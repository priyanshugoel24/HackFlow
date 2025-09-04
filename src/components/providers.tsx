'use client';

import { SessionProvider } from 'next-auth/react';
import { StatusProvider } from './StatusProvider';
import ErrorBoundary from './ErrorBoundary';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Application Error:', error, errorInfo);
        }}
      >
        <StatusProvider>
          {children}
        </StatusProvider>
      </ErrorBoundary>
    </SessionProvider>
  );
}