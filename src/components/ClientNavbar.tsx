"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Navbar from "./Navbar";

export default function ClientNavbar() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR and initial hydration, show a placeholder
  if (!isClient || status === "loading") {
    return (
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
        <div className="px-6 h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-[200px]">
            <div className="text-lg font-semibold text-gray-800 dark:text-white tracking-tight">
              📋 Context Board
            </div>
          </div>
          <div className="w-full ml-48">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border">
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-5 mr-16">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white flex-shrink-0 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
              <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!session) {
    return null;
  }

  return <Navbar />;
}
