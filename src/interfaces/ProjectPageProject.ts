import { Activity } from './Activity';
import { ContextCardWithRelations } from './ContextCardWithRelations';

export interface ProjectPageProject {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  lastActivityAt: string;
  tags?: string[];
  activities?: Activity[];
  contextCards?: ContextCardWithRelations[];
  stats?: {
    totalTasks: number;
    completedTasks: number;
    progress: number;
  };
}
