"use client";
import React, { useMemo, useCallback, memo } from "react";
import { usePresenceStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useAblyPresence } from "@/lib/ably/useAblyPresence";

const OnlineUsers = memo(function OnlineUsers() {
  const { data: session } = useSession();
  const { onlineUsers, isConnected, currentStatus } = usePresenceStore();
  
  // Initialize Ably presence. This hook now only manages the connection.
  useAblyPresence();

  // Memoize status color function
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "Available":
        return "bg-green-500";
      case "Busy":
        return "bg-yellow-500";
      case "Focused":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }, []);

  // Memoize users computation to prevent unnecessary re-renders
  const allUsers = useMemo(() => {
    const currentUserInList = onlineUsers.find((u) => u.id === session?.user?.email);

    let users = onlineUsers;

    if (currentUserInList) {
      users = onlineUsers.map((u) =>
        u.id === session?.user?.email ? { ...u, status: currentStatus } : u
      );
    } else if (session?.user?.email) {
      const currentUserData = {
        id: session.user.email,
        name: session.user.name || "You",
        image: session.user.image || undefined,
        status: currentStatus,
        lastSeen: new Date().toISOString(),
      };
      users = [currentUserData, ...users];
    }

    return users;
  }, [onlineUsers, session?.user?.email, session?.user?.name, session?.user?.image, currentStatus]);

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
        <span>Connecting...</span>
      </div>
    );
  }

  if (allUsers.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No users online
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allUsers.map((user) => (
        <div key={user.id} className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="text-xs">
                {user.name
                  .split(' ')
                  .map(word => word[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-800 ${getStatusColor(user.status)}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user.name}
              {user.id === session?.user?.email && (
                <span className="text-xs text-gray-500 ml-1">(you)</span>
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.status}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

export default OnlineUsers;
