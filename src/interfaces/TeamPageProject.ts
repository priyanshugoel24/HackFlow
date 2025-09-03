export interface TeamPageProject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  lastActivityAt: string;
  tags: string[];
  isArchived: boolean;
  _count: {
    contextCards: number;
  };
  stats?: {
    totalTasks: number;
    completedTasks: number;
    progress: number;
  };
}
