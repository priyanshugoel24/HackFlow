"use client";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [userStatus, setUserStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: "Available", label: "Available", color: "bg-green-500" },
    { value: "Busy", label: "Busy", color: "bg-yellow-500" },
    { value: "Focused", label: "Focused", color: "bg-red-500" },
  ];

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
    } catch (err) {
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
        setDropdownOpen(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update status");
      }
    } catch (err) {
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

  const currentStatus = userStatus?.state || "Available";
  const currentStatusConfig = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">Context Board</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Username */}
          <span className="text-gray-700 font-medium">
            {session.user?.name || session.user?.email?.split('@')[0]}
          </span>

          {/* Status Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={statusLoading}
            >
              <div className={`w-2 h-2 rounded-full ${currentStatusConfig.color}`}></div>
              <span className="text-sm font-medium">{currentStatus}</span>
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
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updateStatus(option.value)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                      currentStatus === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                    disabled={statusLoading}
                  >
                    <div className={`w-2 h-2 rounded-full ${option.color}`}></div>
                    <span>{option.label}</span>
                    {currentStatus === option.value && (
                      <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
                <hr className="my-1" />
                <button
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="absolute top-full right-0 mt-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
