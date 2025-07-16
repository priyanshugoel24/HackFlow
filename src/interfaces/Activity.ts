export interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  project?: {
    id: string;
    name: string;
    slug: string;
  };
}
