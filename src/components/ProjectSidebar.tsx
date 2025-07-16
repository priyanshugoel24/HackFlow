"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectModal from "./ProjectModal";
import { ChevronLeft, ChevronRight, Archive, UserCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

export default function ProjectSidebar({ 
  onSelect, 
  onRefreshNeeded 
}: { 
  onSelect: (id: string) => void;
  onRefreshNeeded?: (refreshFn: () => void) => void;
}) {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(280); // default sidebar width
  const [loading, setLoading] = useState(true);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const isResizing = useRef(false);
  const router = useRouter();

  const handleProjectCreated = () => {
    fetchProjects(); // Refresh projects after creation
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/api/projects?includeArchived=false");
      // Make sure we're only showing active projects in the sidebar
      const activeProjects = res.data.projects?.filter((project: any) => !project.isArchived) || [];
      setProjects(activeProjects);
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || collapsed) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setWidth(newWidth);
      }
    };

    const stopResize = () => {
      isResizing.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [collapsed]);

  const handleProjectSelect = (projectSlug: string) => {
    setSelectedProjectSlug(projectSlug);
    onSelect(projectSlug);
    router.push(`/projects/${projectSlug}`);
  };

  const activeProjects = projects.filter(p => !p.isArchived);
  const archivedProjects = projects.filter(p => p.isArchived);

  return (
    <>
      <div
        ref={sidebarRef}
        className={cn(
          "h-full border-r bg-white dark:bg-gray-900 dark:border-gray-700 flex flex-col transition-all duration-200",
          collapsed ? "w-[48px]" : ""
        )}
        style={!collapsed ? { width: `${width}px` } : undefined}
      >
        <div className="p-4 space-y-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-base text-gray-800 dark:text-gray-100">Projects</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {activeProjects.length} active
                  {archivedProjects.length > 0 && `, ${archivedProjects.length} archived`}
                </p>
              </div>
            )}
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Project list */}
          {!collapsed && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-xs mt-2">Loading...</p>
                </div>
              ) : (
                <>
                  {/* Active Projects */}
                  {activeProjects.length > 0 && (
                    <div className="space-y-2">
                      {activeProjects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.slug)}
                          className={cn(
                            "block w-full text-left bg-white dark:bg-gray-900 hover:shadow-md border border-gray-200 dark:border-gray-600 px-4 py-3 rounded-xl transition-all",
                            selectedProjectSlug === project.slug && "ring-2 ring-blue-500"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-gray-800 dark:text-gray-100">{project.name}</p>
                              <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-gray-500 dark:text-gray-400">
                                {project.members && project.members.length > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <UserCircle className="h-4 w-4" />
                                    <span>{project.members.length}</span>
                                  </div>
                                )}
                                {project._count && (
                                  <div className="flex items-center space-x-1">
                                    <FileText className="h-4 w-4" />
                                    <span>{project._count.contextCards}</span>
                                  </div>
                                )}
                              </div>
                              {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {project.tags.slice(0, 2).map((tag: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {project.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      +{project.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Archived Projects */}
                  {archivedProjects.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 px-3">
                        <Archive className="h-3 w-3" />
                        <span>Archived</span>
                      </div>
                      {archivedProjects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.slug)}
                          className={cn(
                            "block w-full text-left hover:shadow-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl transition-colors opacity-60",
                            selectedProjectSlug === project.slug && "ring-2 ring-blue-500"
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            <Archive className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-gray-800 dark:text-gray-100">{project.name}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {projects.length === 0 && !loading && (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      <p className="text-sm">No projects yet</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Add Project Button */}
          {!collapsed && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm rounded-lg" 
                onClick={() => setOpen(true)}
                disabled={loading}
              >
                + Add Project
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Resizer */}
      {!collapsed && (
        <div
          className="w-1 bg-gray-200 dark:bg-gray-700 cursor-col-resize hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          onMouseDown={() => (isResizing.current = true)}
        />
      )}

      {/* Modal */}
      <ProjectModal open={open} setOpen={setOpen} onSuccess={handleProjectCreated} />
    </>
  );
}