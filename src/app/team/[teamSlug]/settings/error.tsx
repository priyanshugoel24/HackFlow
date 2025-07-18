'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Team Settings Page Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Failed to load team settings
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We couldn't load the team settings. You might not have permission to access this page or there's a temporary issue.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Details (Development)
              </summary>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                {error.message}
                {error.digest && `\nError ID: ${error.digest}`}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col gap-2">
            <Button
              onClick={reset}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full flex items-center justify-center gap-2"
            >
              <Link href="/">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
