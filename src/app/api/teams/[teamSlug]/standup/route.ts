import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { gemini } from "@/lib/gemini"; 

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamSlug: string }> }
) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET
  });
  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const { teamSlug } = resolvedParams;

  // Get the team and verify user access
  const team = await prisma.team.findUnique({
    where: { slug: teamSlug },
    include: {
      members: {
        where: { 
          user: { email: token.email },
          status: 'ACTIVE'
        },
      },
      projects: {
        where: { isArchived: false },
        select: { id: true, name: true }
      }
    },
  });

  if (!team || team.members.length === 0) {
    return NextResponse.json({ error: "Team not found or access denied" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: token.email },
    select: { lastSeenat: true },
  });

  const since = user?.lastSeenat ?? new Date(Date.now() - 1000 * 60 * 60 * 24); // fallback: 24h ago
  const projectIds = team.projects.map(p => p.id);

  const [cards, comments] = await Promise.all([
    prisma.contextCard.findMany({
      where: {
        projectId: { in: projectIds },
        updatedAt: { gt: since },
      },
      include: { 
        user: true,
        project: { select: { name: true } }
      },
    }),
    prisma.comment.findMany({
      where: {
        createdAt: { gt: since },
        card: {
          projectId: { in: projectIds },
        },
      },
      include: { 
        author: true, 
        card: { 
          include: { 
            project: { select: { name: true } }
          }
        }
      },
    }),
  ]);

  const activitySummary = `
  You are an assistant summarizing recent team updates for "${team.name}" since ${since.toISOString()}.

  Recent Card Updates Across Team Projects:
  ${cards
    .map((c) => `- "${c.title}" in ${c.project.name} updated by ${c.user.name || c.user.email}`)
    .join("\n")}

  Recent Comments:
  ${comments
    .map((c) => `- Comment on "${c.card.title}" in ${c.card.project.name} by ${c.author.name || c.author.email}`)
    .join("\n")}

  Create a brief, friendly standup digest highlighting:
  1. Key progress made across team projects
  2. Active discussions and collaboration
  3. Any blockers or important updates
  4. Overall team momentum

  Keep it conversational and under 150 words.
  `;

  try {
    const result = await gemini.generateContent(activitySummary);
    const summary = result || "Unable to generate summary";
    
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json({ 
      summary: `Recent activity summary for ${team.name}:\n\n` +
               `📋 ${cards.length} cards updated across ${team.projects.length} projects\n` +
               `💬 ${comments.length} new comments\n\n` +
               `Check individual projects for detailed updates.`
    });
  }
}
