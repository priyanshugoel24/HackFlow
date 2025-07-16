export interface CardUpdate {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  updatedAt: string;
  userId: string;
  projectId: string;
  user: {
    id: string;
    name: string;
    image: string;
  };
}
