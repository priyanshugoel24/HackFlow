'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectHackathonRedirect() {
  const { teamSlug } = useParams();
  const router = useRouter();

  useEffect(() => {
    // Redirect to team-level hackathon since hackathon is now a team-level feature
    if (teamSlug) {
      router.replace(`/team/${teamSlug}/hackathon`);
    }
  }, [teamSlug, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to team hackathon...</p>
      </div>
    </div>
  );
}
