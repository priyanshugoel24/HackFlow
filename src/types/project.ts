// Project-related types
export interface Project {
  id: string;
  name: string;
  description?: string;
  slug: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  teamId: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  slug: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  teamId: string;
  team?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProjectWithRelations {
  id: string;
  name: string;
  description?: string;
  slug: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  teamId: string;
  contextCards: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  team: {
    id: string;
    name: string;
    slug: string;
    members: Array<{
      id: string;
      role: string;
      user: {
        id: string;
        name: string;
        email: string;
        image?: string;
      };
    }>;
  };
}

export interface ProjectCardData {
  id: string;
  name: string;
  description?: string;
  slug: string;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  teamName?: string;
  teamSlug?: string;
  totalCards: number;
  completedCards: number;
  recentActivity?: string;
}

export interface ProjectAnalytics {
  totalCards: number;
  completedCards: number;
  inProgressCards: number;
  todoCards: number;
  contributors: Array<{
    id: string;
    name: string;
    email: string;
    image?: string;
    contributionCount: number;
  }>;
  weeklyVelocity: Array<{
    week: string;
    completed: number;
    created: number;
  }>;
  cardTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
}

export interface ProjectInvitation {
  id: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
  projectId: string;
  invitedById: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  tags?: string[];
  teamId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  tags?: string[];
  isArchived?: boolean;
}

// Page-specific project types
export type ProjectPageProject = ProjectWithRelations;

export type ProjectSettingsProject = ProjectData;

// Search types
export interface ProjectSearchData {
  id: string;
  name: string;
  slug: string;
  teamName?: string;
}
