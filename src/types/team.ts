// Team-related types
export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isHackathonMode: boolean;
  hackathonDeadline?: Date;
  hackathonEndedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

export interface TeamWithRelations {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isHackathonMode: boolean;
  hackathonDeadline?: Date;
  hackathonEndedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  members: TeamMemberWithRelations[];
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    tags: string[];
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export interface TeamMemberWithRelations {
  id: string;
  role: 'MEMBER' | 'ADMIN';
  joinedAt: Date;
  lastSeenAt?: Date;
  userId: string;
  teamId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface TeamMember {
  id: string;
  role: 'MEMBER' | 'ADMIN';
  joinedAt: Date;
  lastSeenAt?: Date;
  userId: string;
  teamId: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
  teamId: string;
  invitedById: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CreateTeamData {
  name: string;
  description?: string;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  isHackathonMode?: boolean;
  hackathonDeadline?: Date;
  hackathonEndedAt?: Date;
}

export interface TeamAnalytics {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  totalMembers: number;
  totalCards: number;
  completedCards: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: Date;
    user: {
      name: string;
      image?: string;
    };
  }>;
}

export interface TeamHackathon {
  isActive: boolean;
  deadline?: Date;
  endedAt?: Date;
  projects: Array<{
    id: string;
    name: string;
    slug: string;
    progress: number;
    members: Array<{
      id: string;
      name: string;
      image?: string;
    }>;
  }>;
}

// Page-specific team types
export type TeamPageTeam = TeamWithRelations;

export type TeamSettingsTeam = TeamWithRelations;

export type TeamPageMember = TeamMemberWithRelations;

export type TeamSettingsMember = TeamMemberWithRelations;

export interface TeamPageProject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  totalCards?: number;
  completedCards?: number;
  progress?: number;
}

export interface HackathonTeam extends Team {
  projects: HackathonProject[];
  members: HackathonTeamMember[];
}

export interface HackathonTeamMember {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: 'MEMBER' | 'ADMIN';
  joinedAt: Date;
}

export interface HackathonProject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tags: string[];
  progress: number;
  totalCards: number;
  completedCards: number;
  members: Array<{
    id: string;
    name: string;
    image?: string;
  }>;
}

// Search types
export interface TeamSearchData {
  id: string;
  name: string;
  slug: string;
}
