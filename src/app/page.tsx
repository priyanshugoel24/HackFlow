"use client";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import LoginPage from "@/components/LoginPage";
import ProjectSidebar from "@/components/ProjectSidebar";
import ContextCardList from "@/components/ContextCardList";
import ProjectCard from "@/components/ProjectCard"; // new component
import PendingInvitations from "@/components/PendingInvitations";
import { useState, useRef } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedProjectSlug, setSelectedProjectSlug] = useState("");
  const refreshProjectsRef = useRef<(() => void) | null>(null);
  const refreshSidebarRef = useRef<(() => void) | null>(null);

  const handleInvitationAccepted = () => {
    // Refresh both the project cards and sidebar when an invitation is accepted
    refreshProjectsRef.current?.();
    refreshSidebarRef.current?.();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex h-[calc(100vh-60px)]">
        {/* Sidebar */}
        <ProjectSidebar 
          onSelect={setSelectedProjectSlug} 
          onRefreshNeeded={(refreshFn: () => void) => {
            refreshSidebarRef.current = refreshFn;
          }}
        />

        {/* Main area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {selectedProjectSlug ? (
            <ContextCardList projectSlug={selectedProjectSlug} />
          ) : (
            <div className="space-y-6">
              <PendingInvitations onInvitationAccepted={handleInvitationAccepted} />
              <ProjectCard 
                onSelect={setSelectedProjectSlug} 
                onRefreshNeeded={(refreshFn: () => void) => {
                  refreshProjectsRef.current = refreshFn;
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}