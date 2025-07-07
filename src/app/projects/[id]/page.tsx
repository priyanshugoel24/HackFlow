"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  User2,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import OnlineUsers from "@/components/OnlineUsers";
import DebugPresence from "@/components/DebugPresence";
import InviteMemberModal from "@/components/InviteMemberModal";
import { usePresence } from "@/lib/socket/usePresence";
import { useStatus } from "@/components/StatusProvider";

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { onlineUsers, isConnected } = usePresence();
  const { status: currentUserStatus } = useStatus();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
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
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>

        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
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
                <p className="text-gray-600 mb-4">{project.description}</p>
              )}

              <div className="flex items-center space-x-4 text-sm text-gray-500">
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
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {project.link && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = project.link.startsWith("http")
                      ? project.link
                      : `https://${project.link}`;
                    window.open(url, "_blank");
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
              {/* Online Users */}
              <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Online Now {!isConnected && "(Reconnecting...)"}
                </h3>
                {onlineUsers.length === 0 ? (
                  <div className="text-gray-500 text-sm">No users currently online</div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {onlineUsers.map((user) => {
                      // Use current user's status from StatusProvider if it's the current user
                      const displayStatus = user.id === session?.user?.id ? currentUserStatus : user.status;
                      
                      return (
                        <div key={user.id} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md shadow-sm border border-gray-200">
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
                              <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full border">
                                <UserRound className="h-4 w-4 text-gray-600" />
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
                            <div className="text-sm text-gray-800 font-medium">{user.name}</div>
                            {displayStatus && displayStatus !== "Available" && (
                              <div className="text-xs text-gray-500">{displayStatus}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* <DebugPresence /> */}
              <InviteMemberModal open={inviteOpen} setOpen={setInviteOpen} projectId={projectId} />
<Button onClick={() => setInviteOpen(true)}>Invite Member</Button>
        {/* Context Cards */}
        <ContextCardList projectId={projectId} />
      </div>
    </div>
  );
}
