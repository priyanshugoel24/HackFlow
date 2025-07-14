// lib/searchData.ts
import { prisma } from "@/lib/prisma";

export async function getGlobalSearchData() {
  try {
    const [cards, projects, members] = await Promise.all([
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
            },
          },
        },
      }),
      prisma.project.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          tags: true,
        },
      }),
      prisma.projectMember.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, slug: true, name: true } },
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
    }));

    const projectData = projects.map((project) => ({
      type: "project" as const,
      id: `project-${project.id}`,
      originalId: project.id,
      title: project.name,
      slug: project.slug,
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
    }));

    return [...cardData, ...projectData, ...tagData, ...memberData];
  } catch (error) {
    console.error("Error fetching search data:", error);
    return [];
  }
}