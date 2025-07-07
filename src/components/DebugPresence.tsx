"use client";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePresence } from "@/lib/socket/usePresence";
import { useSocket } from "@/lib/socket/useSocket";
import { useStatus } from "@/components/StatusProvider";

export default function DebugPresence() {
  const { data: session } = useSession();
  const { onlineUsers, isConnected: presenceConnected, updatePresence } = usePresence();
  const { isConnected: socketConnected, connectionState } = useSocket();
  const { status: currentStatus, isConnected: statusConnected } = useStatus();
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const testPresence = async () => {
    if (!session?.user?.id) {
      console.log("❌ Cannot test presence - missing session");
      return;
    }

    console.log("🧪 Testing Ably presence with:", {
      userId: session.user.id,
      name: session.user.name,
    });

    try {
      if (updatePresence) {
        await updatePresence({
          name: session.user.name || "Test User",
          lastSeen: new Date().toISOString(),
        });
        console.log("✅ Ably presence updated");
        setLastUpdate(new Date());
      } else {
        console.log("❌ updatePresence not available");
      }
    } catch (error) {
      console.error("❌ Error testing Ably presence:", error);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-semibold mb-2">Debug Presence (Ably)</h3>
      <div className="space-y-2 text-sm">
        <div>Socket Connected: {socketConnected ? "✅" : "❌"} ({connectionState})</div>
        <div>Presence Connected: {presenceConnected ? "✅" : "❌"}</div>
        <div>Status Connected: {statusConnected ? "✅" : "❌"}</div>
        <div>Current Status: <span className="font-medium">{currentStatus}</span></div>
        <div>User ID: {session?.user?.id || "None"}</div>
        <div>User Name: {session?.user?.name || "None"}</div>
        <div>Online Users Count: {onlineUsers.length}</div>
        <div>Last Update: {lastUpdate ? lastUpdate.toLocaleTimeString() : "Never"}</div>
        <Button onClick={testPresence} size="sm" disabled={!presenceConnected}>
          Test Presence
        </Button>
        <Button 
          onClick={() => {
            if (updatePresence) {
              updatePresence({ status: currentStatus });
              setLastUpdate(new Date());
            }
          }} 
          size="sm" 
          disabled={!presenceConnected}
        >
          Sync Status
        </Button>
        <div className="mt-2">
          <h4 className="font-medium">Online Users:</h4>
          <ul className="text-xs">
            {onlineUsers.map(user => (
              <li key={user.id}>
                {user.name} ({user.status || 'Available'})
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
