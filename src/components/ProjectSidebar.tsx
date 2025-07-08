"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectModal from "./ProjectModal";
import { ChevronLeft, ChevronRight, Archive, Users, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

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
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
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
        className={`h-full border-r bg-white flex flex-col transition-all duration-200 ${
          collapsed ? "w-14" : "w-[var(--sidebar-width)]"
        }`}
        style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}
      >
        <div className="p-3 space-y-4 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            {!collapsed && (
              <div>
                <h2 className="font-semibold text-lg">Projects</h2>
                <p className="text-xs text-gray-500">
                  {activeProjects.length} active
                  {archivedProjects.length > 0 && `, ${archivedProjects.length} archived`}
                </p>
              </div>
            )}
            <button
              onClick={() => setCollapsed((prev) => !prev)}
              className="p-1 hover:bg-gray-100 rounded"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Project list */}
          {!collapsed && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-gray-500 py-4">
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
                            "block w-full text-left hover:bg-gray-100 px-3 py-2 rounded-md transition-colors",
                            selectedProjectSlug === project.slug && "bg-blue-50 border-l-4 border-blue-500"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{project.name}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                {project.members && project.members.length > 0 && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Users className="h-3 w-3" />
                                    <span>{project.members.length}</span>
                                  </div>
                                )}
                                {project._count && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Hash className="h-3 w-3" />
                                    <span>{project._count.contextCards}</span>
                                  </div>
                                )}
                              </div>
                              {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
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
                    <div className="space-y-2 pt-3 border-t">
                      <div className="flex items-center space-x-2 text-xs text-gray-500 px-3">
                        <Archive className="h-3 w-3" />
                        <span>Archived</span>
                      </div>
                      {archivedProjects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => handleProjectSelect(project.slug)}
                          className={cn(
                            "block w-full text-left hover:bg-gray-100 px-3 py-2 rounded-md transition-colors opacity-60",
                            selectedProjectSlug === project.slug && "bg-blue-50 border-l-4 border-blue-500"
                          )}
                        >
                          <div className="flex items-center space-x-2">
                            <Archive className="h-4 w-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{project.name}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {projects.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-4">
                      <p className="text-sm">No projects yet</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Add Project Button */}
          {!collapsed && (
            <div className="pt-4 border-t">
              <Button 
                className="w-full" 
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
          className="w-1 bg-gray-200 cursor-col-resize hover:bg-gray-400 transition"
          onMouseDown={() => (isResizing.current = true)}
        />
      )}

      {/* Modal */}
      <ProjectModal open={open} setOpen={setOpen} onSuccess={handleProjectCreated} />
    </>
  );
}