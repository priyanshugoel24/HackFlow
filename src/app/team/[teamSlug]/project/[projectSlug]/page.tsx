"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LoginPage from "@/components/LoginPage";
import ContextCardList from "@/components/ContextCardList";
import OnlineUsers from "@/components/OnlineUsers";
import ActivityFeed from "@/components/ActivityFeed";
import BackButton from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import axios from "axios";

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
  stats?: {
    totalTasks: number;
    completedTasks: number;
    progress: number;
  };
}

interface Team {
  id: string;
  name: string;
  slug: string;
}

export default function TeamProjectPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const teamSlug = params?.teamSlug as string;
  const projectSlug = params?.projectSlug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Fetch team first
      const teamRes = await axios.get(`/api/teams/${teamSlug}`);
      const teamData = teamRes.data;
      setTeam(teamData);

      // Find the project within the team
      const project = teamData.projects?.find((p: any) => p.slug === projectSlug);
      if (!project) {
        throw new Error("Project not found in team");
      }
      setProject(project);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [teamSlug, projectSlug]);

  useEffect(() => {
    if (teamSlug && projectSlug) {
      fetchData();
    }
  }, [teamSlug, projectSlug, fetchData]);

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

  if (error || !project || !team) {
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
            <Button onClick={() => router.push(`/team/${teamSlug}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
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
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <Link 
            href={`/team/${teamSlug}`}
            className="hover:text-gray-900 dark:hover:text-white transition"
          >
            {team.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{project.name}</span>
        </div>

        {/* Back Button */}
        <BackButton 
          label="Back to Team" 
          className="mb-8"
        />

        {/* Project Header */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight">
                  {project.name}
                </h1>
                {project.isArchived && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <Archive className="h-3 w-3 mr-1" />
                    Archived
                  </Badge>
                )}
              </div>

              {project.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  {project.description}
                </p>
              )}

              {/* Progress Bar */}
              {project.stats && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Task Progress
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {project.stats.completedTasks}/{project.stats.totalTasks} tasks completed
                    </span>
                  </div>
                  <Progress value={project.stats.progress} className="h-2" />
                </div>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {formatDate(project.lastActivityAt)}</span>
                </div>
                
                {project.members && (
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{project.members.length} member{project.members.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex space-x-2 ml-6">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/team/${teamSlug}/project/${projectSlug}/analytics`}>
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analytics
                </Link>
              </Button>

              <Button variant="outline" size="sm" asChild>
                <Link href={`/team/${teamSlug}/project/${projectSlug}/settings`}>
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Context Cards */}
          <div className="lg:col-span-3">
            <ContextCardList projectSlug={projectSlug} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Recent Activity
              </h3>
              <ActivityFeed projectId={project.id} />
            </div>

            {/* Online Team Members */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <UserRound className="h-4 w-4 mr-2" />
                Online Now
              </h3>
              <OnlineUsers />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
