export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isArchived: boolean;
  hackathonModeEnabled?: boolean;
  tags?: string[];
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  teamId: string;
  team?: {
    id: string;
    name: string;
    slug: string;
  };
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    user: {
      id: string;
      name?: string;
      email: string;
      image?: string;
    };
  }>;
}
