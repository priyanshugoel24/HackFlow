export interface NextAuthToken {
  sub?: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  [key: string]: unknown;
}