// lib/logActivity.ts
import { prisma } from "./prisma";

export async function logActivity({
  type,
  description,
  userId,
  projectId,
  metadata = {},
}: {
  type: "CARD_CREATED" | "COMMENT_CREATED" | "CARD_EDITED" | "CARD_UPDATED" | "PROJECT_CREATED" | "MEMBER_JOINED" | "MEMBER_REMOVED" | string;
  description: string;
  userId?: string | null;
  projectId: string;
  metadata?: any;
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