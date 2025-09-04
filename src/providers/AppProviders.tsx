'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { RealtimeProvider } from './RealtimeProvider';
import { Toaster } from 'sonner';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <RealtimeProvider>
          {children}
          <Toaster
            position="bottom-right"
            expand={false}
            richColors
            closeButton
          />
        </RealtimeProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
