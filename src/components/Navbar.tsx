"use client";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useStatus } from "@/components/StatusProvider";
import { usePresence } from "@/lib/socket/usePresence";
import ActivityFeed from "@/components/ActivityFeed";
import { Bell } from "lucide-react";
import { useParams } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { data: session } = useSession();
  const { status: userStatus, updateStatus: updateUserStatus } = useStatus();
  const { isConnected } = usePresence();
  const [statusLoading, setStatusLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { slug } = useParams<{ slug: string }>(); // Get current project slug
  const [showNotifications, setShowNotifications] = useState(false);

  const statusOptions = [
    { value: "Available", label: "Available", color: "bg-green-500" },
    { value: "Busy", label: "Busy", color: "bg-yellow-500" },
    { value: "Focused", label: "Focused", color: "bg-red-500" },
  ];

  const updateStatus = async (newState: string) => {
    setStatusLoading(true);
    setError("");
    try {
      updateUserStatus(newState);
      setDropdownOpen(false);
      console.log("✅ Status updated via Ably:", newState);
    } catch (err) {
      setError("Failed to update status");
      console.error("❌ Error updating status:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!session) {
    return null;
  }

  const currentStatus = userStatus || "Available";
  const currentStatusConfig = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="text-lg font-semibold text-gray-800 dark:text-white tracking-tight">📋 Context Board</div>
        {!isConnected && (
          <span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded">
            Reconnecting...
          </span>
        )}

        <SearchBar />
        
        <div className="flex items-center gap-4" ref={dropdownRef}>
          {/* Theme Toggle */}
          <ThemeToggle />

          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative"
          >
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white" />
          </button>
          {/* Profile Button */}
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:shadow-sm transition bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-white"
            disabled={statusLoading}
          >
            <img
              src={session.user?.image || "/default-avatar.png"}
              alt="User Avatar"
              className="w-8 h-8 rounded-full object-cover"
            />
            <span>{session.user?.name || session.user?.email?.split('@')[0]}</span>
            <div className={`w-2 h-2 rounded-full ${currentStatusConfig.color}`}></div>
            <svg 
              className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className="absolute top-14 right-4 w-52 rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 z-20 py-2"
            >
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateStatus(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between ${
                    currentStatus === option.value ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  disabled={statusLoading}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${option.color}`}></div>
                    <span>{option.label}</span>
                  </div>
                  {currentStatus === option.value && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              <button
                onClick={() => signOut()}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 border-t border-gray-100 dark:border-gray-700"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-full right-0 mt-2 px-4 py-2 bg-red-50 dark:bg-red-900 text-sm text-red-600 dark:text-red-300 border border-red-300 dark:border-red-500 rounded-md shadow-md z-30">
            {error}
          </div>
        )}
      </div>
      {showNotifications && (
        <div className="fixed top-16 right-0 w-[380px] max-h-[calc(100vh-64px)] shadow-lg border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 z-50 flex flex-col animate-slide-in transition-all duration-300">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Activity Feed</h2>
            <button onClick={() => setShowNotifications(false)} className="text-gray-500 dark:text-gray-300 hover:text-black dark:hover:text-white transition">
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto px-4 py-2 flex-1 text-gray-800 dark:text-gray-200">
            <ActivityFeed slug={slug} />
          </div>
        </div>
      )}
    </nav>
  );
}
