interface ExistingCard {
  id: string;
  title: string;
  content: string;
  type: "TASK" | "INSIGHT" | "DECISION";
  visibility: "PRIVATE" | "PUBLIC";
  why?: string;
  issues?: string;
  slackLinks?: string[];
  attachments?: string[];
  status: "ACTIVE" | "CLOSED";
  isArchived?: boolean;
  userId?: string;
  summary?: string;
}

export default ExistingCard;