export interface ExistingCard {
  id: string;
  title: string;
  content: string;
  type: "TASK" | "INSIGHT" | "DECISION";
  visibility: "PRIVATE" | "PUBLIC";
  why?: string;
  issues?: string;
  attachments?: string[];
  status: "ACTIVE" | "CLOSED";
  isArchived?: boolean;
  userId?: string;
  summary?: string;
  assignedTo?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    emailVerified: Date | null;
    lastSeenat: Date | null;
  } | null;
}

export default ExistingCard;