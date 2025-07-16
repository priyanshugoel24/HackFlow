import { PresenceUser } from './PresenceUser';
import { UserStatus } from './UserStatus';

export interface PresenceState {
  onlineUsers: PresenceUser[];
  isConnected: boolean;
  currentStatus: UserStatus;
  setOnlineUsers: (users: PresenceUser[]) => void;
  addOrUpdateUser: (user: PresenceUser) => void;
  removeUser: (userId: string) => void;
  setIsConnected: (isConnected: boolean) => void;
  setCurrentStatus: (status: UserStatus) => void;
  updateUserStatus: (userId: string, status: UserStatus) => void;
}
