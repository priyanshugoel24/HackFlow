import { Activity } from './Activity';
import { ContextCardWithRelations } from './ContextCardWithRelations';

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
  activities?: Activity[];
  contextCards?: ContextCardWithRelations[];
  stats?: {
    totalTasks: number;
    completedTasks: number;
    progress: number;
  };
}
