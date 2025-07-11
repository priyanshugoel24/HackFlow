import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import Fuse from "fuse.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const bodySchema = z.object({
  prompt: z.string().min(1).max(2000),
});

// Enhanced fuzzy matching for project identification
function findRelevantProjects(prompt: string, projects: Array<{id: string, name: string, slug: string}>) {
  const queryLower = prompt.toLowerCase();
  const relevantProjects: Array<{project: typeof projects[0], score: number, reason: string}> = [];

  // Create Fuse instance for fuzzy search
  const fuse = new Fuse(projects, {
    keys: ['name', 'slug'],
    threshold: 0.4, // Allow for typos and partial matches
    includeScore: true,
  });

  // 1. Direct fuzzy search matches
  const fuseResults = fuse.search(queryLower);
  fuseResults.forEach(result => {
    if (result.score! < 0.4) { // Good fuzzy match
      relevantProjects.push({
        project: result.item,
        score: 1 - result.score!, // Convert to relevance score
        reason: `Fuzzy match for "${result.item.name}"`
      });
    }
  });

  // 2. Exact substring matches (highest priority)
  projects.forEach(project => {
    const projectName = project.name.toLowerCase();
    const projectSlug = project.slug.toLowerCase();
    
    if (projectName.includes(queryLower) || queryLower.includes(projectName) || 
        projectSlug.includes(queryLower) || queryLower.includes(projectSlug)) {
      relevantProjects.push({
        project,
        score: 0.95,
        reason: `Direct name match for "${project.name}"`
      });
    }
  });

  // 3. Quoted project names
  const quotedMatches = queryLower.match(/["']([^"']+)["']/g);
  if (quotedMatches) {
    quotedMatches.forEach(quoted => {
      const quotedName = quoted.slice(1, -1).toLowerCase();
      projects.forEach(project => {
        const projectName = project.name.toLowerCase();
        if (projectName.includes(quotedName) || quotedName.includes(projectName)) {
          relevantProjects.push({
            project,
            score: 0.9,
            reason: `Quoted match for "${project.name}"`
          });
        }
      });
    });
  }

  // 4. Pattern-based matches
  const patterns = [
    /(?:project|in|for|about)\s+["']?([^"'\s]+(?:\s+[^"'\s]+)*?)["']?(?:\s|$|[,.!?])/gi,
    /(?:working on|update on|status of)\s+["']?([^"'\s]+(?:\s+[^"'\s]+)*?)["']?(?:\s|$|[,.!?])/gi,
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(prompt)) !== null) {
      const extractedName = match[1].toLowerCase().trim();
      projects.forEach(project => {
        const projectName = project.name.toLowerCase();
        if (projectName.includes(extractedName) || extractedName.includes(projectName)) {
          relevantProjects.push({
            project,
            score: 0.8,
            reason: `Pattern match for "${project.name}"`
          });
        }
      });
    }
  });

  // Remove duplicates and sort by score
  const uniqueProjects = new Map<string, typeof relevantProjects[0]>();
  relevantProjects.forEach(item => {
    const existing = uniqueProjects.get(item.project.id);
    if (!existing || item.score > existing.score) {
      uniqueProjects.set(item.project.id, item);
    }
  });

  return Array.from(uniqueProjects.values()).sort((a, b) => b.score - a.score);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json();
  const parse = bodySchema.safeParse(json);

  if (!parse.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { prompt } = parse.data;

  try {
    // First, ensure the user exists in the database and get the actual user
    const user = await prisma.user.upsert({
      where: { email: token.email! },
      update: {
        name: token.name,
        image: token.picture,
      },
      create: {
        email: token.email!,
        name: token.name,
        image: token.picture,
      },
    });

    // Get all projects the user has access to (including detailed information)
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [
          { createdById: user.id },
          { 
            members: { 
              some: { 
                userId: user.id,
                status: "ACTIVE"
              } 
            } 
          }
        ],
        isArchived: false,
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          where: { status: "ACTIVE" }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            contextCards: {
              where: { isArchived: false }
            }
          }
        }
      },
    });

    if (userProjects.length === 0) {
      return NextResponse.json({ 
        answer: "You don't have access to any projects yet. Create a project to get started! You can create projects to organize your context cards, tasks, insights, and decisions." 
      });
    }

    // Get comprehensive context data for all projects
    const allProjectIds = userProjects.map(p => p.id);
    
    // Fetch all context cards with comprehensive data
    const allCards = await prisma.contextCard.findMany({
      where: {
        projectId: { in: allProjectIds },
        isArchived: false,
        OR: [
          { visibility: "PUBLIC" },
          { userId: user.id },
          { assignedToId: user.id }
        ]
      },
      include: {
        project: { 
          select: { id: true, name: true, slug: true } 
        },
        user: { 
          select: { id: true, name: true, email: true } 
        },
        assignedTo: { 
          select: { id: true, name: true, email: true } 
        },
        linkedCard: {
          select: { id: true, title: true, type: true }
        },
        linkedFrom: {
          select: { id: true, title: true, type: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 100, // Limit for performance but enough for comprehensive analysis
    });

    // Fetch recent activities for context
    const recentActivities = await prisma.activity.findMany({
      where: {
        projectId: { in: allProjectIds },
      },
      include: {
        user: {
          select: { id: true, name: true }
        },
        project: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Recent activities for context
    });

    // Use enhanced fuzzy logic to find relevant projects
    const relevantProjects = findRelevantProjects(prompt, userProjects);

    // Determine the scope of the response
    let focusedProjects: typeof userProjects = [];
    let responseScope = "general";

    if (relevantProjects.length > 0) {
      // If we found specific project matches, focus on those
      const relevantProjectIds = relevantProjects.slice(0, 3).map(rp => rp.project.id);
      focusedProjects = userProjects.filter(p => relevantProjectIds.includes(p.id));
      responseScope = relevantProjects.length === 1 ? "single-project" : "multi-project";
    } else {
      // For general queries, include all projects
      focusedProjects = userProjects;
      responseScope = "general";
    }

    // Filter cards based on focused projects
    const relevantCards = allCards.filter(card => 
      focusedProjects.some(project => project.id === card.projectId)
    );

    // Build comprehensive context for AI
    const projectSummaries = focusedProjects.map(project => {
      const projectCards = relevantCards.filter(card => card.projectId === project.id);
      const memberCount = project.members.length;
      const cardCount = project._count.contextCards;
      
      const cardsByType = {
        TASK: projectCards.filter(c => c.type === 'TASK').length,
        INSIGHT: projectCards.filter(c => c.type === 'INSIGHT').length,
        DECISION: projectCards.filter(c => c.type === 'DECISION').length,
      };

      const cardsByStatus = {
        ACTIVE: projectCards.filter(c => c.status === 'ACTIVE').length,
        CLOSED: projectCards.filter(c => c.status === 'CLOSED').length,
      };

      return `
PROJECT: ${project.name} (${project.slug})
- Created by: ${project.createdBy.name || project.createdBy.email}
- Members: ${memberCount} active member(s)
- Total Cards: ${cardCount}
- Card Types: ${cardsByType.TASK} tasks, ${cardsByType.INSIGHT} insights, ${cardsByType.DECISION} decisions
- Card Status: ${cardsByStatus.ACTIVE} active, ${cardsByStatus.CLOSED} closed
- Description: ${project.description || 'No description provided'}
- Tags: ${project.tags.length > 0 ? project.tags.join(', ') : 'No tags'}
      `.trim();
    });

    // Build detailed card context
    const cardContext = relevantCards.map(card => {
      const assignedInfo = card.assignedTo ? ` | Assigned to: ${card.assignedTo.name || card.assignedTo.email}` : '';
      const linkedInfo = card.linkedCard ? ` | Linked to: ${card.linkedCard.title}` : '';
      const statusInfo = card.status ? ` | Status: ${card.status}` : '';
      
      return `[${card.project.name}] (${card.type}${statusInfo}) ${card.title}: ${card.content}${assignedInfo}${linkedInfo}`;
    }).join('\n');

    // Build activity context
    const activityContext = recentActivities.map(activity => {
      const userName = activity.user?.name || 'Unknown User';
      return `[${activity.project.name}] ${userName}: ${activity.type} - ${activity.description}`;
    }).join('\n');

    // Generate comprehensive system prompt
    const systemPrompt = `
You are an intelligent project assistant with comprehensive access to a user's project ecosystem.

SCOPE: ${responseScope.toUpperCase()} (${focusedProjects.length} project(s) in focus)

USER CONTEXT:
- User: ${user.name || user.email}
- Total Projects: ${userProjects.length}
- Total Accessible Cards: ${allCards.length}

PROJECT SUMMARIES:
${projectSummaries.join('\n\n')}

CONTEXT CARDS (${relevantCards.length} cards):
${cardContext}

${activityContext.length > 0 ? `RECENT ACTIVITIES:
${activityContext}` : ''}

USER QUERY: ${prompt}

INSTRUCTIONS:
- Provide comprehensive, actionable insights based on the available data
- Reference specific projects, cards, and team members when relevant
- If the query is about a specific project, focus on that project's data
- For general queries, provide overview insights across all projects
- Suggest next actions or improvements when appropriate
- Use the user's name and project-specific terminology
- If no relevant data is found, suggest ways the user can add more context
- Be concise but thorough in your response

${relevantProjects.length > 0 ? `RELEVANT PROJECT MATCHES FOUND:
${relevantProjects.map(rp => `- ${rp.project.name} (${rp.reason}, score: ${rp.score.toFixed(2)})`).join('\n')}` : ''}
    `.trim();

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });
    
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text().trim();

    // Log for debugging (remove in production)
    console.log(`🤖 AI Assistant - User: ${user.email}, Query: "${prompt.substring(0, 50)}...", Scope: ${responseScope}, Projects: ${focusedProjects.length}, Cards: ${relevantCards.length}`);

    return NextResponse.json({ 
      answer: text,
      metadata: {
        scope: responseScope,
        projectsAnalyzed: focusedProjects.length,
        cardsAnalyzed: relevantCards.length,
        relevantProjects: relevantProjects.length > 0 ? relevantProjects.slice(0, 3).map(rp => ({
          name: rp.project.name,
          reason: rp.reason,
          score: rp.score
        })) : null
      }
    });

  } catch (err) {
    console.error("AI assistant error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ 
      error: "I'm having trouble processing your request right now. Please try again in a moment." 
    }, { status: 500 });
  }
}