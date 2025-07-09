"use client";
import { usePresence } from "@/lib/socket/usePresence";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

export default function OnlineUsers() {
  const { data: session } = useSession();
  const { onlineUsers, isConnected } = usePresence();

  // Filter out current user
  const currentUserId = (session?.user as { id?: string })?.id;
  const otherUsers = onlineUsers.filter(user => user.id !== currentUserId);

  console.log("🔍 OnlineUsers render:", { 
    isConnected, 
    totalUsers: onlineUsers.length, 
    otherUsers: otherUsers.length,
    currentUserId,
    users: onlineUsers.map(u => ({ id: u.id, name: u.name }))
  });

  if (!isConnected) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-muted-foreground">Reconnecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-muted-foreground">
          {otherUsers.length > 0 ? `${otherUsers.length} online` : 'Online'}
        </span>
      </div>
      
      {otherUsers.length > 0 && (
        <div className="flex -space-x-2">
          {otherUsers.slice(0, 3).map((user) => (
            <div key={user.id} className="group relative">
              <Avatar className="w-6 h-6 border-2 border-background dark:border-border">
                <AvatarImage src={user.image} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {user.name}
                {user.status && (
                  <span className="ml-1 text-gray-300 dark:text-gray-600">({user.status})</span>
                )}
              </div>
            </div>
          ))}
          {otherUsers.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-muted dark:bg-muted/60 border-2 border-background dark:border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground dark:text-muted-foreground">+{otherUsers.length - 3}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
