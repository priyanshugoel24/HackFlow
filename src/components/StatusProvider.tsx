"use client";
import React, { createContext, useContext } from "react";
import { useAblyStatus, type UserStatus } from "@/lib/ably/useAblyStatus";

interface StatusContextType {
  status: UserStatus;
  updateStatus: (status: UserStatus) => Promise<void>;
  isConnected: boolean;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const { status, updateStatus, isConnected } = useAblyStatus();

  return (
    <StatusContext.Provider
      value={{
        status,
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
