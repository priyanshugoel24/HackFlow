// lib/searchData.ts
import { prisma } from "@/lib/prisma";

export async function getGlobalSearchData() {
  try {
    const [cards, projects, members, teams] = await Promise.all([
      prisma.contextCard.findMany({
        where: {
          isArchived: false, // Only show non-archived cards
        },
        select: {
          id: true,
          title: true,
          projectId: true,
          project: {
            select: {
              slug: true,
              name: true,
              team: {
                select: {
                  name: true,
                  slug: true,
                }
              }
            },
          },
        },
      }),
      prisma.project.findMany({
        where: {
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          tags: true,
          team: {
            select: {
              name: true,
              slug: true,
            }
          }
        },
      }),
      prisma.projectMember.findMany({
        where: {
          status: "ACTIVE",
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { 
            select: { 
              id: true, 
              slug: true, 
              name: true,
              team: {
                select: {
                  name: true,
                  slug: true,
                }
              }
            } 
          },
        },
      }),
      prisma.team.findMany({
        where: {
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: {
            select: {
              projects: { where: { isArchived: false } }
            }
          }
        },
      }),
    ]);

    const cardData = cards.map((card) => ({
      type: "card" as const,
      id: `card-${card.id}`,
      originalId: card.id,
      title: card.title || "Untitled Card",
      projectId: card.projectId,
      projectSlug: card.project?.slug || "",
      projectName: card.project?.name || "",
      teamName: card.project?.team?.name || "",
      teamSlug: card.project?.team?.slug || "",
    }));

    const projectData = projects.map((project) => ({
      type: "project" as const,
      id: `project-${project.id}`,
      originalId: project.id,
      title: project.name,
      slug: project.slug,
      teamName: project.team?.name || "",
      teamSlug: project.team?.slug || "",
    }));

    const teamData = teams.map((team) => ({
      type: "team" as const,
      id: `team-${team.id}`,
      originalId: team.id,
      title: team.name,
      name: team.name,
      slug: team.slug,
      description: team.description || "",
      projectCount: team._count.projects,
    }));

    const tagData = projects.flatMap((project) =>
      (project.tags || []).map((tag) => ({
        type: "tag" as const,
        id: `tag-${project.id}-${tag}`,
        originalId: `${project.id}-${tag}`,
        tag,
        projectId: project.id,
        projectSlug: project.slug,
        projectName: project.name,
        teamName: project.team?.name || "",
        teamSlug: project.team?.slug || "",
      }))
    );

    const memberData = members.map((member) => ({
      type: "member" as const,
      id: `member-${member.userId}-${member.projectId}`,
      originalId: member.userId,
      name: member.user.name || member.user.email?.split('@')[0] || "User",
      email: member.user.email || "",
      projectId: member.projectId,
      projectSlug: member.project.slug,
      projectName: member.project.name,
      teamName: member.project.team?.name || "",
      teamSlug: member.project.team?.slug || "",
    }));

    return [...cardData, ...projectData, ...teamData, ...tagData, ...memberData];
  } catch (error) {
    console.error("Error fetching search data:", error);
    return [];
  }
}