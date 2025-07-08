"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExternalLink, Folder, Users, Calendar, Archive } from "lucide-react";

export default function ProjectCardGrid({ onSelect, onRefreshNeeded }: { 
  onSelect: (id: string) => void;
  onRefreshNeeded?: (refreshFn: () => void) => void;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const router = useRouter();

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects?includeArchived=true");
      const data = await res.json();
      setAllProjects(data.projects || []);
      // Filter out archived projects
      const filteredProjects = data.projects?.filter((project: any) => 
        showArchived ? true : !project.isArchived
      ) || [];
      setProjects(filteredProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // Expose refresh function to parent
    onRefreshNeeded?.(fetchProjects);
  }, [onRefreshNeeded]);

  useEffect(() => {
    // Filter projects based on showArchived state
    if (allProjects.length > 0) {
      const filteredProjects = allProjects.filter((project) => 
        showArchived ? true : !project.isArchived
      );
      setProjects(filteredProjects);
    }
  }, [showArchived, allProjects]);

  const toggleShowArchived = () => {
    setShowArchived(!showArchived);
  };

  const filteredProjects = showArchived ? allProjects : allProjects.filter(project => !project.isArchived);

  if (loading) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2">Loading projects...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <Folder className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No projects found</p>
        <p className="text-sm">Create your first project to get started!</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleProjectClick = (projectSlug: string) => {
    router.push(`/projects/${projectSlug}`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">Projects</h2>
          <button
            onClick={toggleShowArchived}
            className="flex items-center space-x-1 text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Archive className="h-3.5 w-3.5 mr-1" />
            {showArchived ? "Hide Archived" : "Show Archived"}
          </button>
          {showArchived && allProjects.some(project => project.isArchived) && (
            <span className="text-xs text-gray-500">
              Showing {allProjects.filter(project => project.isArchived).length} archived
            </span>
          )}
        </div>
        {/* <button
          onClick={() => router.push('/projects/new')}
          className="bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm hover:bg-blue-700"
        >
          New Project
        </button> */}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card
            key={project.id}
            className={cn(
              "cursor-pointer group hover:shadow-md hover:border-blue-500 hover:bg-gray-50 transition border border-gray-200 h-full rounded-lg bg-white p-2",
              project.isArchived && "opacity-60"
            )}
            onClick={() => handleProjectClick(project.slug)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2 flex-1">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-blue-500" />
                  {project.isArchived && <Archive className="h-4 w-4 text-gray-400" />}
                </div>
                <CardTitle className="text-[15px] font-semibold group-hover:text-blue-600 truncate">
                  {project.name}
                </CardTitle>
              </div>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </CardHeader>
            
            <CardContent className="space-y-2 px-2 pb-3">
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
              
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 mt-2">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(project.lastActivityAt)}</span>
                </div>
              </div>
              
              {project._count && (
                <div className="text-xs text-gray-500">
                  {project._count.contextCards} context card{project._count.contextCards !== 1 ? 's' : ''}
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 overflow-x-auto max-w-full scrollbar-hide">
                {project.tags && project.tags.length > 0 && (
                  <>
                    {project.tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs rounded-md">
                        {tag}
                      </Badge>
                    ))}
                    {project.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs rounded-md">
                        +{project.tags.length - 3} more
                      </Badge>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs rounded-md">
                    {project.isArchived ? "Archived" : "Active"}
                  </Badge>
                  {project.createdBy && (
                    <div className="text-xs text-gray-500">
                      by {project.createdBy.name || project.createdBy.email}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}