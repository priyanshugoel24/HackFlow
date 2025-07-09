"use client";
import React, { createContext, useContext } from "react";
import { useAblyPresence } from "@/lib/ably/useAblyPresence";

export type UserStatus = "Available" | "Busy" | "Focused" | "Away";

interface StatusContextType {
  status: string;
  updateStatus: (status: string) => void;
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
