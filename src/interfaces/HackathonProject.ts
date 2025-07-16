export interface HackathonProject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count: {
    contextCards: number;
  };
}
