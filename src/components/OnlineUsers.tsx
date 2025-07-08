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
      default: return "bg-green-500";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-800 border border-gray-200 w-full max-w-md">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-base">👥 Online Users</h3>
        <span className={`text-xs ${isConnected ? "text-green-600" : "text-red-500"}`}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {onlineUsers
          // Deduplicate users by ID to prevent duplicate keys
          .filter((user, index, array) => 
            array.findIndex(u => u.id === user.id) === index
          )
          .map((user) => {
          const displayStatus = user.id === session?.user?.id ? currentUserStatus : user.status;
          const statusColor = getStatusColor(displayStatus);
          const initials = user.name
            ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
            : "??";

          return (
            <li key={user.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-medium flex items-center justify-center text-xs">
                    {initials}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor}`} title={displayStatus || "Available"} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  {displayStatus && displayStatus !== "Available" && (
                    <span className="text-xs text-gray-500">{displayStatus}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default OnlineUsers;
