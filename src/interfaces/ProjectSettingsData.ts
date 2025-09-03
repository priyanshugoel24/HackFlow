export interface ProjectSettingsData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isArchived: boolean;
  createdAt: string;
  lastActivityAt: string;
  team: {
    slug: string;
    members: Array<{
      user: {
        id: string;
        name?: string;
        email: string;
        image?: string;
      };
      status: string;
    }>;
  };
  createdBy: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  contextCards: Array<{
    id: string;
    title: string;
    content?: string | null;
    type: string;
    status: string | null;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name?: string | null;
      email: string | null;
    };
    assignedTo?: {
      id: string;
      name?: string | null;
      email: string | null;
    } | null;
  }>;
}
