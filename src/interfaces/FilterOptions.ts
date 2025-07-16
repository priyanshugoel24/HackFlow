export interface FilterOptions {
  type?: 'TASK' | 'INSIGHT' | 'DECISION';
  status?: 'ACTIVE' | 'CLOSED';
  visibility?: 'PRIVATE' | 'PUBLIC';
  isPinned?: boolean;
  isArchived?: boolean;
  userId?: string;
  projectId?: string;
}
