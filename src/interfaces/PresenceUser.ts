import { UserStatus } from './UserStatus';

export type PresenceUser = {
  id: string;
  name: string;
  image?: string;
  status: UserStatus;
  lastSeen: string;
};
