export interface TeamSettingsMember {
  id: string;
  role: 'OWNER' | 'MEMBER';
  status: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}
