"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LoginPage from "@/components/LoginPage";
import ContextCardList from "@/components/ContextCardList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Calendar,
  Archive,
  Settings,
  UserRound,
  BarChart3,
} from "lucide-react";
import Image from "next/image";
import InviteMemberModal from "@/components/InviteMemberModal";
import OnlineUsers from "@/components/OnlineUsers";
import { usePresence } from "@/lib/socket/usePresence";
import { useStatus } from "@/components/StatusProvider";

interface Project {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
  }>;
  lastActivityAt: string;
  tags?: string[];
  link?: string;
}

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const projectSlug = params?.slug as string;
  const { onlineUsers } = usePresence();
  const { status: currentUserStatus, isConnected } = useStatus();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectSlug}`);
      if (!res.ok) {
        throw new Error("Failed to fetch project");
      }
      const data = await res.json();
      setProject(data.project);
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectSlug]);

  useEffect(() => {
    if (projectSlug) {
      fetchProject();
    }
  }, [projectSlug, fetchProject]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Project Not Found
            </h1>
            <p className="text-gray-600 mb-4">
              {error || "The project you're looking for doesn't exist."}
            </p>
            <Button onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 md:px-10 md:py-10">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-8 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        {/* Project Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
                  {project.name}
                </h1>
                {project.isArchived && (
                  <Badge
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <Archive className="h-3 w-3" />
                    <span>Archived</span>
                  </Badge>
                )}
              </div>

              {project.description && (
                <p className="mt-1 text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {project.members?.length || 0} member
                    {project.members?.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Last updated {formatDate(project.lastActivityAt)}</span>
                </div>
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag: string, index: number) => (
                    <Badge key={`${project.id}-tag-${index}-${tag}`} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 flex-wrap justify-end mt-2 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/projects/${projectSlug}/analytics`)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                asChild
              >
                <Link href={`/projects/${projectSlug}/settings`}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="ml-2"
                onClick={() => setInviteOpen(true)}
              >
                <UserRound className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
          </div>
        </div>
              {/* Online Users */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 mt-10 dark:border-gray-700 shadow-md p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Online Now {!isConnected && "(Reconnecting...)"}
                </h3>
                {onlineUsers.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-500 text-sm">No users currently online</div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {Array.from(new Map(onlineUsers.map(user => [user.id, user])).values())
                      .map((user, index) => {
                      // Use current user's status from StatusProvider if it's the current user
                      const sessionUser = session?.user as { id: string; name?: string | null; email?: string | null; image?: string | null } | undefined;
                      const displayStatus = user.id === sessionUser?.id ? currentUserStatus : user.status;
                      
                      return (
                        <div key={`${user.id}-${index}`} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 px-3 py-2 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow transition-all">
                          <div className="relative">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name}
                                width={32}
                                height={32}
                                className="rounded-full object-cover border w-8 h-8"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-full border">
                                <UserRound className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                            )}
                            <span 
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${
                                displayStatus === "Available" ? "bg-green-500" :
                                displayStatus === "Busy" ? "bg-yellow-500" :
                                displayStatus === "Focused" ? "bg-red-500" :
                                "bg-gray-400"
                              }`}
                              title={displayStatus || "Available"}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{user.name}</div>
                            {displayStatus && displayStatus !== "Available" && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 italic">{displayStatus}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* <DebugPresence /> */}
              <InviteMemberModal 
                open={inviteOpen} 
                setOpen={setInviteOpen} 
                projectSlug={projectSlug} 
                onSuccess={() => {
                  // Refresh project data when member is successfully invited
                  fetchProject();
                }}
              />
        <div className="mt-16"></div><ContextCardList projectSlug={projectSlug} />
      </div>
    </div>
  );
}
