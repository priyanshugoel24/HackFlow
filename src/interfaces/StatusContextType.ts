import { PresenceUser } from './PresenceUser';
import { UserStatus } from './UserStatus';

export interface StatusContextType {
  status: UserStatus;
  updateStatus: (status: UserStatus) => void;
  onlineUsers: PresenceUser[];
  isConnected: boolean;
}
