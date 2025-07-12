import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { gemini } from "@/lib/gemini"; 

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const token = await getToken({ req });
  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: token.email },
    select: { lastSeenat: true },
  });

  const since = user?.lastSeenat ?? new Date(Date.now() - 1000 * 60 * 60 * 24); // fallback: 24h ago

  const [cards, comments] = await Promise.all([
    prisma.contextCard.findMany({
      where: {
        projectId: projectId,
        updatedAt: { gt: since },
      },
      include: { user: true },
    }),
    prisma.comment.findMany({
      where: {
        createdAt: { gt: since },
        card: {
          projectId: projectId,
        },
      },
      include: { author: true, card: true },
    }),
  ]);

  const activitySummary = `
  You are an assistant summarizing recent project updates since ${since.toISOString()}.

  Recent Card Updates:
  ${cards
    .map((c) => `- "${c.title}" updated by ${c.user.name || c.user.email}`)
    .join("\n")}

  Recent Comments:
  ${comments
    .map(
      (c) =>
        `- ${c.author.name || c.author.email} commented on "${c.card.title}": ${c.content}`
    )
    .join("\n")}

  Summarize the above as a short daily standup digest.`;

  try {
    const aiResponse = await gemini.generateContent(activitySummary);
    return NextResponse.json({ summary: aiResponse }, { status: 200 });
  } catch (error) {
    console.error("Gemini summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}