export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

export interface AuthToken {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

export interface AuthAccount {
  provider: string;
  type: string;
  id: string;
  providerAccountId: string;
  refresh_token?: string | null;
  access_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
  [key: string]: unknown;
}

export interface TeamMemberResponse {
  status: string;
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
}
