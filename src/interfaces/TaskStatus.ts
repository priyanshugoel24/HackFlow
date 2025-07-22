// TaskStatus enum matching the Prisma schema
export enum TaskStatus {
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED"
}

export type TaskStatusType = keyof typeof TaskStatus;
