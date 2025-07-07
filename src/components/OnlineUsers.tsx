"use client";
import { usePresence } from "@/lib/socket/usePresence";
import { useStatus } from "@/components/StatusProvider";
import { useSession } from "next-auth/react";

const OnlineUsers = () => {
  const { onlineUsers, isConnected } = usePresence();
  const { status: currentUserStatus } = useStatus();
  const { data: session } = useSession();

  console.log("👥 OnlineUsers render:", { 
    onlineUsersCount: onlineUsers.length, 
    isConnected,
    users: onlineUsers.map(u => ({ id: u.id, name: u.name, status: u.status }))
  });

  if (onlineUsers.length === 0) {
    return (
      <div className="text-sm text-gray-600">
        👥 No users online {isConnected ? "(Connected)" : "(Disconnected)"}
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Available": return "bg-green-500";
      case "Busy": return "bg-yellow-500";
      case "Focused": return "bg-red-500";
      case "Away": return "bg-gray-400";
      default: return "bg-green-500";
    }
  };

  return (
    <div className="text-sm text-gray-600">
      👥 Online Users ({onlineUsers.length}) {!isConnected && "(Disconnected)"}:
      <ul className="mt-1 space-y-1">
        {onlineUsers.map((user) => {
          // Use current user's status from StatusProvider if it's the current user
          const displayStatus = user.id === session?.user?.id ? currentUserStatus : user.status;
          
          return (
            <li key={user.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(displayStatus)}`} 
                   title={displayStatus || "Available"} />
              <span>{user.name}</span>
              {displayStatus && displayStatus !== "Available" && (
                <span className="text-xs text-gray-500">({displayStatus})</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OnlineUsers;
