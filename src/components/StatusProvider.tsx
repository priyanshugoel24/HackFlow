"use client";
import React, { createContext, useContext } from "react";
import { useAblyPresence, type UserStatus } from "@/lib/ably/useAblyPresence";

// Re-export the UserStatus type for convenience
export type { UserStatus };

interface StatusContextType {
  status: UserStatus;
  updateStatus: (status: UserStatus) => Promise<void>;
  isConnected: boolean;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const { currentStatus, updateStatus, isConnected } = useAblyPresence();

  return (
    <StatusContext.Provider
      value={{
        status: currentStatus,
        updateStatus,
        isConnected,
      }}
    >
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
