export interface ProjectInvitation {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  status: string;
  joinedAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    link?: string;
    tags: string[];
    createdAt: string;
    lastActivityAt: string;
  };
  addedBy: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  } | null;
}
