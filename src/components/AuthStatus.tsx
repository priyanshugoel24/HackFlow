"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const [userStatus, setUserStatus] = useState<{ state: string; updatedAt: string } | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchStatus = async () => {
    if (!session) return;
    
    setStatusLoading(true);
    setError("");
    try {
      const response = await fetch("/api/status");
      if (response.ok) {
        const data = await response.json();
        setUserStatus(data.status);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch status");
      }
    } catch {
      setError("Network error");
    } finally {
      setStatusLoading(false);
    }
  };

  const updateStatus = async (newState: string) => {
    setStatusLoading(true);
    setError("");
    try {
      const response = await fetch("/api/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: newState }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStatus(data.status);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update status");
      }
    } catch {
      setError("Network error");
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchStatus();
    }
  }, [session]);

  if (status === "loading") {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Context Board</h1>
      
      {session ? (
        <div className="space-y-4">
          <div className="border-b pb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Signed in as</p>
            <p className="font-medium">{session.user?.email}</p>
            {/* <p className="text-sm text-gray-500 dark:text-gray-400">ID: {session.user?.id}</p> */}
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Status</h3>
            {statusLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading status...</p>
            ) : error ? (
              <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">
                  Current: <span className="font-medium">{userStatus?.state || "Available"}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus("Available")}
                    className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded"
                    disabled={statusLoading}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => updateStatus("Busy")}
                    className="px-3 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded"
                    disabled={statusLoading}
                  >
                    Busy
                  </button>
                  <button
                    onClick={() => updateStatus("Focused")}
                    className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded"
                    disabled={statusLoading}
                  >
                    Focused
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded hover:bg-red-700 dark:hover:bg-red-600"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">Please sign in to continue</p>
          <button
            onClick={() => signIn()}
            className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
}