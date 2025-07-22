export interface AuthProfile {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface AuthToken {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface AuthSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
}

export interface AuthAccount {
  provider: string;
  providerAccountId: string;
  type: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}
