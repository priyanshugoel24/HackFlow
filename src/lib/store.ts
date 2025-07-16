import { create } from 'zustand';

export type UserStatus = "Available" | "Busy" | "Focused";

export type PresenceUser = {
  id: string;
  name: string;
  image?: string;
  status: UserStatus;
  lastSeen: string;
};

interface PresenceState {
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

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: [],
  isConnected: false,
  currentStatus: 'Available',
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOrUpdateUser: (user) =>
    set((state) => {
      const existingIndex = state.onlineUsers.findIndex((u) => u.id === user.id);
      if (existingIndex >= 0) {
        const updatedUsers = [...state.onlineUsers];
        updatedUsers[existingIndex] = user;
        return { onlineUsers: updatedUsers };
      } else {
        return { onlineUsers: [...state.onlineUsers, user] };
      }
    }),
  removeUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u.id !== userId),
    })),
  setIsConnected: (isConnected) => set({ isConnected }),
  setCurrentStatus: (status) => set({ currentStatus: status }),
  updateUserStatus: (userId, status) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.map((user) =>
        user.id === userId ? { ...user, status } : user
      ),
      currentStatus: state.currentStatus, // ensure currentStatus is maintained
    })),
}));
