export interface TeamPageMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}
