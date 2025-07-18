'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
}

// Preset loading components for common use cases
export function PageLoadingSpinner({ text = 'Loading page...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function CardLoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg flex items-center justify-center">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

export function ComponentLoadingSpinner({ text = 'Loading component...' }: { text?: string }) {
  return (
    <div className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded flex items-center justify-center">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}
