// lib/logActivity.ts
import { prisma } from "./prisma";
import { ActivityMetadata, ActivityType } from "@/interfaces/ActivityTypes";

export async function logActivity({
  type,
  description,
  userId,
  projectId,
  metadata = {},
}: {
  type: ActivityType;
  description: string;
  userId?: string | null;
  projectId: string;
  metadata?: ActivityMetadata;
}) {
  try {
    await prisma.activity.create({
      data: {
        type,
        description,
        userId,
        projectId,
        metadata,
      },
    });
  } catch (err) {
    console.error("🔴 Failed to log activity", err);
  }
}