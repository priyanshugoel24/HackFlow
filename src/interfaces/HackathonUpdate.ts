export interface HackathonUpdate {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
}
