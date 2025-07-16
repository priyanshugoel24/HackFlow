"use client";
import React from "react";
import { usePresenceStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAblyPresence } from "@/lib/ably/useAblyPresence";

export default function OnlineUsers() {
  const { data: session } = useSession();
  const { onlineUsers, isConnected, currentStatus } = usePresenceStore();
  
  // Initialize Ably presence. This hook now only manages the connection.
  useAblyPresence();

  const allUsers = React.useMemo(() => {
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
  }, [onlineUsers, session?.user, currentStatus]);

  const getStatusColor = (status: string) => {
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
  };

  if (!isConnected) {
    return <div className="p-4 text-center text-gray-500">Connecting...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Online Now ({allUsers.length})</h3>
      <div className="space-y-3">
        {allUsers.map((user) => (
          <TooltipProvider key={user.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-3 cursor-pointer">
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || ""} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(
                        user.status
                      )}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name} {user.id === session?.user?.email ? "(You)" : ""}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {user.name} - {user.status || "Available"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}
