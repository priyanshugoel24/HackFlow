export interface ProjectCardData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tags?: string[];
  isArchived: boolean;
  createdAt: string;
  lastActivityAt: string;
  teamId?: string;
  team?: {
    name: string;
    slug: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  contextCards?: Array<{
    id: string;
    status: string;
  }>;
  _count?: {
    contextCards: number;
  };
}
