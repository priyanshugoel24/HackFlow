import { NextRequest, NextResponse } from 'next/server';

// Redirect to team-level hackathon updates since hackathon is now a team-level feature
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; projectSlug: string }> }
) {
  const { teamSlug } = await params;
  
  // Redirect to team-level hackathon updates
  return NextResponse.redirect(
    new URL(`/api/teams/${teamSlug}/hackathon-updates`, request.url),
    { status: 308 } // Permanent redirect
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamSlug: string; projectSlug: string }> }
) {
  const { teamSlug } = await params;
  
  // Redirect to team-level hackathon updates
  return NextResponse.redirect(
    new URL(`/api/teams/${teamSlug}/hackathon-updates`, request.url),
    { status: 308 } // Permanent redirect
  );
}
