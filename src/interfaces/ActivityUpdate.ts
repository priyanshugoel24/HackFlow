export interface ActivityUpdate {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userId: string;
  projectId: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}
