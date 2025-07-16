export interface ProjectPageProject {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
  }>;
  lastActivityAt: string;
  tags?: string[];
  link?: string;
  stats?: {
    totalTasks: number;
    completedTasks: number;
    progress: number;
  };
}
