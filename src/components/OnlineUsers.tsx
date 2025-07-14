"use client";
import React from "react";
import { usePresence } from "@/lib/socket/usePresence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

export default function OnlineUsers() {
  const { data: session } = useSession();
  const { onlineUsers, isConnected, currentStatus } = usePresence();

  // Ensure current user is included in the list with optimized memoization
  const currentUserId = (session?.user as { id?: string })?.id;
  const currentUser = session?.user as { id?: string; name?: string; image?: string };
  
  // Optimize user list computation with more specific dependencies
  const allUsers = React.useMemo(() => {
    if (!currentUser?.id) return onlineUsers;
    
    // Check if current user is already in the list
    const existingUserIndex = onlineUsers.findIndex(user => user.id === currentUser.id);
    
    if (existingUserIndex >= 0) {
      // Update current user's status if it's different
      const existingUser = onlineUsers[existingUserIndex];
      if (existingUser.status !== currentStatus) {
        const updatedUsers = [...onlineUsers];
        updatedUsers[existingUserIndex] = { ...existingUser, status: currentStatus || "Available" };
        return updatedUsers;
      }
      return onlineUsers;
    }
    
    // Add current user to the list if not present
    const currentUserData = {
      id: currentUser.id,
      name: currentUser.name || "You",
      image: currentUser.image,
      status: currentStatus || "Available",
      lastSeen: new Date().toISOString(),
    };
    
    return [currentUserData, ...onlineUsers];
  }, [onlineUsers, currentUser?.id, currentStatus]);

  console.log("🔍 OnlineUsers render:", { 
    isConnected, 
    totalUsers: onlineUsers.length, 
    allUsers: allUsers.length,
    currentUserId,
    currentStatus,
    users: allUsers.map(u => ({ id: u.id, name: u.name, status: u.status }))
  });

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
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-muted-foreground">Reconnecting...</span>
      </div>
    );
  }

  if (allUsers.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-sm text-muted-foreground">No users online</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-muted-foreground">
          {allUsers.length} user{allUsers.length !== 1 ? 's' : ''} online
        </span>
      </div>
      
      <div className="space-y-2">
        {allUsers.map((user) => (
          <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="relative">
              <Avatar className="w-8 h-8 border-2 border-background dark:border-border">
                <AvatarImage src={user.image} alt={user.name || 'User'} />
                <AvatarFallback className="text-xs">
                  {(user.name || user.id?.split('@')[0] || 'U')?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Status indicator */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(user.status || "Available")} rounded-full border-2 border-background dark:border-border`}></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm text-foreground truncate">{user.name || user.id?.split('@')[0] || 'User'}</div>
                {user.id === currentUserId && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground capitalize">{user.status || "Available"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
