import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import type { TaskStatus, Prisma } from "@prisma/client";
import { logActivity } from "@/lib/logActivity";
import { getAblyServer } from "@/lib/ably";
import { 
  contextCardSchema, 
  validateInput, 
  sanitizeText, 
  sanitizeHtml, 
  createRateLimiter,
  validateFileUpload 
} from "@/lib/security";

// Rate limiter: 60 requests per minute per user (increased from 20)
const rateLimiter = createRateLimiter(60 * 1000, 60);

// GET all context cards for logged-in user
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Query params
  const { searchParams } = new URL(req.url);
  const assignedTo = searchParams.get("assignedTo");
  const status = searchParams.get("status");
  const teamId = searchParams.get("teamId");
  const projectId = searchParams.get("projectId"); // Add projectId parameter
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50); // max 50 per page

  try {
    // First, ensure the user exists in the database
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

    // Build query for assigned cards
    let where: Prisma.ContextCardWhereInput = { isArchived: false };

    // If assignedTo is provided, fetch cards where the user is assigned OR created by them
    if (assignedTo) {
      // Check if assignedTo is an email or user ID
      const isEmail = assignedTo.includes('@');
      
      if (isEmail) {
        // Find user by email first
        const assignedUser = await prisma.user.findUnique({
          where: { email: assignedTo },
          select: { id: true }
        });
        
        if (assignedUser) {
          where = {
            ...where,
            OR: [
              { assignedToId: assignedUser.id },
              { userId: assignedUser.id }
            ],
          };
          
          // If teamId is also provided, add team filter to assignedTo results
          if (teamId) {
            where = {
              ...where,
              project: {
                teamId: teamId
              }
            };
          }
        } else {
          // No user found with this email, return empty results
          where = { ...where, id: 'non-existent-id' };
        }
      } else {
        // Treat as user ID (backwards compatibility)
        where = {
          ...where,
          OR: [
            { assignedToId: assignedTo },
            { userId: assignedTo }
          ],
        };
        
        // If teamId is also provided, add team filter to assignedTo results
        if (teamId) {
          where = {
            ...where,
            project: {
              teamId: teamId
            }
          };
        }
      }
    } else if (teamId) {
      // Fetch all assigned cards for team members
      const teamMembers = await prisma.teamMember.findMany({
        where: { 
          teamId: teamId,
          status: 'ACTIVE'
        },
        select: { userId: true }
      });
      
      const memberUserIds = teamMembers.map(member => member.userId);
      
      if (memberUserIds.length > 0) {
        where = {
          ...where,
          assignedToId: { in: memberUserIds },
          project: {
            teamId: teamId // Ensure cards are from projects in this team
          }
        };
      } else {
        // No team members found, return empty results
        where = { ...where, id: 'non-existent-id' };
      }
    } else if (projectId) {
      // Filter by specific project - check if user has access to this project
      const isCUID = /^c[a-z0-9]{24}$/i.test(projectId);
      
      console.log(`🔍 Checking access for project: ${projectId} (isCUID: ${isCUID}), user: ${user.id}`);
      
      const accessibleProject = await prisma.project.findFirst({
        where: {
          ...(isCUID ? { id: projectId } : { slug: projectId }),
          OR: [
            { createdById: user.id },
            {
              members: {
                some: {
                  userId: user.id,
                  status: "ACTIVE"
                }
              }
            },
            // Team-based access: if user is an active team member and project belongs to that team
            {
              team: {
                members: {
                  some: {
                    userId: user.id,
                    status: "ACTIVE"
                  }
                }
              }
            }
          ],
          isArchived: false,
        },
        select: { id: true, name: true, slug: true }
      });

      if (accessibleProject) {
        console.log(`✅ User has access to project: ${accessibleProject.name} (${accessibleProject.id})`);
        where = {
          ...where,
          projectId: accessibleProject.id
        };
      } else {
        console.log(`❌ User does not have access to project: ${projectId}`);
        // No access to this project, return empty results
        where = { ...where, id: 'non-existent-id' };
      }
    } else {
      // Default: show all cards from projects where user is a member or creator
      where = {
        ...where,
        project: {
          OR: [
            { createdById: user.id },
            {
              members: {
                some: {
                  userId: user.id,
                  status: "ACTIVE"
                }
              }
            },
            // Team-based access: if user is an active team member and project belongs to that team
            {
              team: {
                members: {
                  some: {
                    userId: user.id,
                    status: "ACTIVE"
                  }
                }
              }
            }
          ]
        }
      };
    }
    if (status) {
      where = { ...where, status: status as TaskStatus };
    }

    const cards = await prisma.contextCard.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, name: true, image: true } }, // Fetch creator
        linkedCard: { select: { id: true, title: true } },
        linkedFrom: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: offset,
      take: limit,
    });

    // Manually fetch assigned user information for each card
    const cardsWithAssignedUser = await Promise.all(
      cards.map(async (card) => {
        const cardWithId = card as { assignedToId?: string } & typeof card;
        if (cardWithId.assignedToId) {
          const assignedUser = await prisma.user.findUnique({
            where: { id: cardWithId.assignedToId },
            select: { id: true, name: true, image: true },
          });
          return { ...card, assignedTo: assignedUser };
        }
        return { ...card, assignedTo: null };
      })
    );

    return NextResponse.json({ cards: cardsWithAssignedUser });
  } catch (error) {
    console.error("Error fetching context cards:", error);
    return NextResponse.json({ error: "Failed to fetch context cards" }, { status: 500 });
  }
}

// CREATE a new context card
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token?.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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

  // Rate limiting
  if (!rateLimiter(user.id)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const projectIdentifier = formData.get("projectId") as string; // Could be ID or slug
    const type = (formData.get("type") as string) || "TASK";
    const visibility = (formData.get("visibility") as string) || "PRIVATE";
    const why = formData.get("why") as string | null;
    const issues = formData.get("issues") as string | null;
    const mention = formData.get("mention") as string | null;
    const status = formData.get("status") as TaskStatus | null;
    const notifyUserId = formData.get("notifyUserId") as string | null;

    const attachments = formData.getAll("attachments") as File[];

    // Validate input using security schema
    const validationResult = validateInput(contextCardSchema, {
      title: sanitizeText(title),
      content: sanitizeHtml(content),
      type,
      visibility,
      status: status || "ACTIVE",
      why: why ? sanitizeText(why) : undefined,
      issues: issues ? sanitizeText(issues) : undefined,
      mention: mention ? sanitizeText(mention) : undefined,
      projectId: sanitizeText(projectIdentifier)
    });

    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: "Invalid input", 
        details: validationResult.errors 
      }, { status: 400 });
    }

    // Validate file uploads
    for (const file of attachments) {
      const fileValidation = validateFileUpload(file);
      if (!fileValidation.isValid) {
        return NextResponse.json({ 
          error: `File validation failed: ${fileValidation.error}` 
        }, { status: 400 });
      }
    }

    // Check if the identifier is a CUID (database ID) or a slug
    // CUID format: starts with 'c' followed by 24 alphanumeric characters
    const isCUID = /^c[a-z0-9]{24}$/i.test(projectIdentifier);

    // Verify project access - ALL ACTIVE MEMBERS should be able to create cards
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id: projectIdentifier } : { slug: projectIdentifier }),
        OR: [
          { createdById: user.id },
          {
            members: {
              some: {
                userId: user.id,
                status: "ACTIVE",
              },
            },
          },
          // Team-based access: if user is an active team member and project belongs to that team
          {
            team: {
              members: {
                some: {
                  userId: user.id,
                  status: "ACTIVE"
                }
              }
            }
          }
        ],
        isArchived: false,
      },
      include: {
        members: {
          where: { status: "ACTIVE" },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!project) {
      console.error(`❌ Project not found or access denied`);
      console.error(`   - Project identifier: ${projectIdentifier} (isCUID: ${isCUID})`);
      console.error(`   - User ID: ${user.id}`);
      console.error(`   - User email: ${user.email}`);
      
      // Let's also try to find the project without access restrictions to debug
      const debugProject = await prisma.project.findFirst({
        where: {
          ...(isCUID ? { id: projectIdentifier } : { slug: projectIdentifier }),
          isArchived: false,
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true }
              }
            }
          }
        }
      });
      
      if (debugProject) {
        console.error(`   - Project exists: ${debugProject.name} (${debugProject.id})`);
        console.error(`   - Project creator: ${debugProject.createdById}`);
        console.error(`   - Project members:`, debugProject.members.map(m => ({
          userId: m.userId,
          email: m.user.email,
          status: m.status,
          role: m.role
        })));
      } else {
        console.error(`   - Project does not exist with identifier: ${projectIdentifier}`);
      }
      
      return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
    }

    console.log(`✅ Project found: ${project.name} (${project.id}), user has access`);

    // Store metadata (actual upload to Supabase/S3 will be added later)
    const savedCard = await prisma.contextCard.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        userId: user.id,
        projectId: project.id, // Use the actual project ID from the database
        type: type as "TASK" | "INSIGHT" | "DECISION",
        ...(type === "TASK" && {
      status: status as TaskStatus,
    }),
        visibility: visibility as "PRIVATE" | "PUBLIC",
        why: why || undefined,
        issues: issues || undefined,
        slackLinks: mention ? [mention] : [],
        attachments: attachments.map((f) => f.name), // placeholder, file name only
        ...(notifyUserId && {
          assignedToId: notifyUserId
        }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await logActivity({
      type: "CARD_CREATED",
      description: `created a new ${type.toLowerCase()} "${title.trim()}"`,
      userId: user.id,
      projectId: project.id,
      metadata: {
        cardId: savedCard.id,
        cardType: type,
      },
    });

    // Publish real-time update to Ably
    try {
      const ably = getAblyServer();
      const channel = ably.channels.get(`project:${project.id}`);
      
      await channel.publish("card:created", {
        id: savedCard.id,
        title: savedCard.title,
        content: savedCard.content,
        type: savedCard.type,
        status: savedCard.status,
        createdAt: savedCard.createdAt,
        userId: user.id,
        projectId: project.id,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      });
      
      await channel.publish("activity:created", {
        id: `activity_${Date.now()}`,
        type: "CARD_CREATED",
        description: `created a new ${type.toLowerCase()} "${title.trim()}"`,
        createdAt: new Date().toISOString(),
        userId: user.id,
        projectId: project.id,
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
        },
      });
      
      console.log("📡 Published card:created and activity:created events to Ably for project:", project.id);
      
      // Handle notification for mentioned user
      if (notifyUserId) {
        try {
          // Find the mentioned user
          const mentionedUser = await prisma.user.findUnique({
            where: { id: notifyUserId },
            select: { id: true, name: true, email: true }
          });

          if (mentionedUser) {
            // Log a specific mention activity
            await logActivity({
              type: "USER_MENTIONED",
              description: `mentioned ${mentionedUser.name || 'a team member'} in "${title.trim()}"`,
              metadata: { 
                cardId: savedCard.id,
                mentionedUserId: mentionedUser.id,
                mentionedUserName: mentionedUser.name
              },
              userId: user.id,
              projectId: project.id,
            });

            // Send a direct notification to the mentioned user
            const userChannel = ably.channels.get(`user:${mentionedUser.id}`);
            await userChannel.publish("notification", {
              id: `notification_${Date.now()}`,
              type: "MENTION",
              message: `You were mentioned in a new card "${title.trim()}"`,
              createdAt: new Date().toISOString(),
              metadata: {
                cardId: savedCard.id,
                projectId: project.id,
                mentionedBy: user.id
              }
            });
          }
        } catch (mentionError) {
          console.error("Error processing mention notification:", mentionError);
        }
      }
    } catch (ablyError) {
      console.error("❌ Failed to publish activity to Ably:", ablyError);
    }

    // Update project lastActivityAt
    await prisma.project.update({
      where: { id: project.id },
      data: { lastActivityAt: new Date() },
    });

    return NextResponse.json({ card: savedCard });
  } catch (error) {
    console.error("Error creating context card:", error);
    return NextResponse.json({ error: "Failed to create context card" }, { status: 500 });
  }
}