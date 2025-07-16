export interface CreateContextCardData {
  title: string;
  content: string;
  type: 'TASK' | 'INSIGHT' | 'DECISION';
  visibility: 'PRIVATE' | 'PUBLIC';
  why?: string;
  issues?: string;
  projectId: string;
  attachments?: string[];
  slackLinks?: string[];
}
