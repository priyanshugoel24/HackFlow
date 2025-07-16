export interface TeamInvitation {
  id: string;
  userId: string;
  teamId: string;
  role: string;
  status: string;
  joinedAt: string;
  team: {
    id: string;
    name: string;
    slug: string;
    description?: string;
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
