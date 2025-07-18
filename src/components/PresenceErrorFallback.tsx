'use client';

import { Button } from '@/components/ui/button';

export function PresenceErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Unable to connect</h2>
        <p className="text-muted-foreground mb-4">There was an issue with the real-time connection.</p>
        <Button 
          onClick={() => window.location.reload()}
          className="px-4 py-2"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
