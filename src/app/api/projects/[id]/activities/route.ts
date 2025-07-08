import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Check if the id is a CUID (database ID) or a slug
    const isCUID = /^c[a-z0-9]{24}$/.test(id);
    
    const project = await prisma.project.findFirst({
      where: {
        ...(isCUID ? { id } : { slug: id }),
        isArchived: false,
      },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const activities = await prisma.activity.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
      take: 50, // adjust limit if needed
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}