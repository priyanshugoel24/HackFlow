import { User, Project, ContextCard, Comment, Activity, ProjectMember } from "@prisma/client";

// Extended types for components
export interface ContextCardWithRelations extends ContextCard {
  user: User;
  project: Project;
  assignedTo?: User;
  linkedCard?: ContextCard;
  linkedFrom?: ContextCard[];
  comments?: Comment[];
}

export interface ProjectWithRelations extends Project {
  createdBy: User;
  members: ProjectMember[];
  contextCards?: ContextCard[];
}

export interface CommentWithRelations extends Comment {
  author: User;
  parent?: Comment;
  children?: Comment[];
}

export interface ActivityWithRelations extends Activity {
  user?: User;
  project: Project;
}

export interface UserWithRelations extends User {
  createdProjects?: Project[];
  memberships?: ProjectMember[];
  contextCards?: ContextCard[];
}

export interface ProjectMemberWithRelations extends ProjectMember {
  user: User;
  project: Project;
  addedBy?: User;
}

// Form types
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

export interface UpdateContextCardData extends Partial<CreateContextCardData> {
  isPinned?: boolean;
  isArchived?: boolean;
  status?: 'ACTIVE' | 'CLOSED';
  linkedCardId?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  slug: string;
  link?: string;
}

export interface CreateCommentData {
  content: string;
  cardId: string;
  parentId?: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Status types
export interface OnlineUser {
  id: string;
  name: string;
  image?: string;
  lastSeen: Date;
}

export interface PresenceData {
  userId: string;
  cardId?: string;
  action: 'viewing' | 'editing' | 'left';
  timestamp: Date;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Editor types
export interface EditorState {
  content: string;
  isPreview: boolean;
  isEditing: boolean;
}

export interface FileUploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

// Filter and sort types
export interface FilterOptions {
  type?: 'TASK' | 'INSIGHT' | 'DECISION';
  status?: 'ACTIVE' | 'CLOSED';
  visibility?: 'PRIVATE' | 'PUBLIC';
  isPinned?: boolean;
  isArchived?: boolean;
  userId?: string;
  projectId?: string;
}

export interface SortOptions {
  field: 'createdAt' | 'updatedAt' | 'title';
  order: 'asc' | 'desc';
}

// Notification types
export interface NotificationData {
  type: 'mention' | 'comment' | 'assignment' | 'status_change';
  title: string;
  message: string;
  cardId?: string;
  projectId?: string;
  userId: string;
  read: boolean;
  createdAt: Date;
}
