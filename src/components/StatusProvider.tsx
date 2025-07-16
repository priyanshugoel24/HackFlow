"use client";
import React, { createContext, useContext, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePresenceStore } from "@/lib/store";
import { PresenceUser } from "@/interfaces/PresenceUser";
import { UserStatus } from "@/interfaces/UserStatus";
import { StatusContextType } from "@/interfaces/StatusContextType";
import { useAblyPresence } from "@/lib/ably/useAblyPresence";

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  // Initialize the Ably presence hook, which handles the connection
  useAblyPresence();
  const { data: session } = useSession();

  const {
    currentStatus,
    onlineUsers,
    isConnected,
    updateUserStatus,
    setCurrentStatus,
  } = usePresenceStore();

  const updateStatus = useCallback((newStatus: UserStatus) => {
    const userEmail = session?.user?.email;
    if (userEmail) {
      updateUserStatus(userEmail, newStatus);
    }
    setCurrentStatus(newStatus);
  }, [session, updateUserStatus, setCurrentStatus]);

  const contextValue = {
    status: currentStatus,
    updateStatus,
    onlineUsers,
    isConnected,
  };

  return (
    <StatusContext.Provider value={contextValue}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error("useStatus must be used within a StatusProvider");
  }
  return context;
}
