export interface NextAuthSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
}