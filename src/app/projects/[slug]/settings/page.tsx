"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { getAblyClient } from "@/lib/ably";
import { useSession } from "next-auth/react";

export default function ProjectSettingsPage() {
  const { data: session } = useSession();
  const { slug: projectSlug } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectSlug}`);
        const data = await res.json();
        setProject(data.project);
        setName(data.project.name || "");
        setDescription(data.project.description || "");
        setLink(data.project.link || "");
        setTags(data.project.tags || []);

        const ably = getAblyClient();
        const channel = ably.channels.get(`project:${data.project.id}`);

        const handleProjectUpdate = (msg: any) => {
          const updated = msg.data;
          setProject((prev: any) => ({
            ...prev,
            ...updated,
          }));
          setName(updated.name || "");
          setDescription(updated.description || "");
          setLink(updated.link || "");
          setTags(updated.tags || []);
        };

        channel.subscribe("project:updated", handleProjectUpdate);

        channel.subscribe("member:removed", (msg: any) => {
          setProject((prev: any) => ({
            ...prev,
            members: prev.members.filter((m: any) => m.user.id !== msg.data.userId),
          }));
        });

        channel.subscribe("member:added", (msg: any) => {
          setProject((prev: any) => ({
            ...prev,
            members: [...prev.members, msg.data],
          }));
        });

        channel.subscribe("member:accepted", (msg: any) => {
          setProject((prev: any) => ({
            ...prev,
            members: prev.members.map((m: any) => 
              m.user.id === msg.data.userId 
                ? { ...m, status: "ACTIVE", joinedAt: msg.data.joinedAt }
                : m
            ),
          }));
        });

        channel.subscribe("member:declined", (msg: any) => {
          setProject((prev: any) => ({
            ...prev,
            members: prev.members.filter((m: any) => m.user.id !== msg.data.userId),
          }));
        });

        return () => {
          channel.unsubscribe("project:updated", handleProjectUpdate);
          channel.unsubscribe("member:removed");
          channel.unsubscribe("member:added");
          channel.unsubscribe("member:accepted");
          channel.unsubscribe("member:declined");
          ably.channels.release(`project:${data.project.id}`);
        };
      } catch (error) {
        toast.error("Failed to fetch project");
      } finally {
        setLoading(false);
      }
    };

    if (projectSlug) fetchProject();
  }, [projectSlug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, link, tags }),
      });

      if (res.ok) {
        toast.success("Project updated successfully");
      } else {
        toast.error("Failed to update project");
      }
    } catch (err) {
      toast.error("Error updating project");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-16 px-6 sm:px-8 md:px-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800">
        <h1 className="text-4xl font-bold mb-10 text-zinc-800 dark:text-zinc-100 tracking-tight">Project Settings</h1>

        <section className="border-b border-gray-200 dark:border-zinc-700 pb-8 mb-10">
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-6">Project Info</h2>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">Project Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">Description</label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2 block">Link</label>
              <Input 
                value={link} 
                onChange={(e) => setLink(e.target.value)} 
                className="rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 dark:border-zinc-700 pb-8 mb-10">
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-6">Tags</h2>
          <div className="flex items-center gap-3 mb-5">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag"
              className="flex-1 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <Button 
              variant="outline" 
              onClick={handleAddTag} 
              className="transition-all focus:ring-2 focus:ring-indigo-500 px-4 py-2"
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors rounded-lg px-3 py-1 select-none"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </section>

        {project?.members && (
          <section className="pb-8">
            <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-6 border-b border-gray-200 dark:border-zinc-700 pb-3">Team Members</h2>
            <ul className="space-y-4">
              {project.members.map((member: any) => (
                <li
                  key={member.user.id}
                  className="flex items-center justify-between border border-gray-200 dark:border-zinc-700 bg-muted px-5 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition gap-5 hover:ring-1 hover:ring-indigo-500"
                >
                  <div className="flex items-center gap-5">
                    <img
                      src={member.user.image || "/fallback-avatar.png"}
                      alt={member.user.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-300 dark:ring-zinc-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{member.user.name || member.user.email}</p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">{member.role}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-100 dark:hover:bg-red-900 text-xs px-2 py-1 rounded-md"
                    onClick={async () => {
                      // Confirm before removing
                      if (!confirm("Are you sure you want to remove this member?")) return;
                      // Prevent removing the project creator
                      if (member.user.id === project.createdById) {
                        toast.error("You cannot remove the project creator.");
                        return;
                      }
                      try {
                        const res = await fetch(`/api/projects/${projectSlug}/members/${member.user.id}`, {
                          method: "DELETE",
                        });
                        if (res.ok) {
                          toast.success("Member removed");
                          setProject((prev: any) => ({
                            ...prev,
                            members: prev.members.filter((m: any) => m.user.id !== member.user.id),
                          }));
                          const ably = getAblyClient();
                          const channel = ably.channels.get(`project:${project.id}`);
                          channel.publish("member:removed", { userId: member.user.id });
                        } else {
                          toast.error("Failed to remove member");
                        }
                      } catch {
                        toast.error("Error removing member");
                      }
                    }}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="pt-8 border-t border-gray-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-6">Project Status</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-md font-medium text-zinc-900 dark:text-zinc-100">
                  {project?.isArchived ? "Archived Project" : "Active Project"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {project?.isArchived 
                    ? "This project is currently archived. Unarchive to make it active again." 
                    : "Archive this project to hide it from active views."}
                </p>
              </div>
              {/* Only show if user is project creator or manager */}
              {(project?.createdById === session?.user?.email || 
                project?.members?.some((m: any) => 
                  m.user.id === session?.user?.email && m.role === "MANAGER" && m.status === "ACTIVE"
                )) && (
                <Button
                  variant="outline"
                  className={`transition-all focus:ring-2 ${
                    project?.isArchived 
                      ? "text-green-600 hover:text-green-800 focus:ring-green-500" 
                      : "text-orange-600 hover:text-orange-800 focus:ring-orange-500"
                  }`}
                  onClick={async () => {
                    const action = project?.isArchived ? "unarchive" : "archive";
                    if (!confirm(`Are you sure you want to ${action} this project?`)) {
                      return;
                    }

                    try {
                      const res = await fetch(`/api/projects/${project.id}/archive`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          isArchived: !project.isArchived,
                        }),
                      });

                      if (res.ok) {
                        setProject({
                          ...project,
                          isArchived: !project.isArchived,
                        });
                        toast.success(`Project ${action}d`, {
                          description: `The project has been ${action}d successfully.`,
                        });
                      } else {
                        const errorData = await res.json();
                        toast.error(`Failed to ${action} project`, {
                          description: errorData.error || `Unable to ${action} the project. Please try again.`,
                        });
                      }
                    } catch (err) {
                      console.error(`Error ${action}ing project:`, err);
                      toast.error(`Error ${action}ing project`, {
                        description: "An unexpected error occurred. Please try again.",
                      });
                    }
                  }}
                >
                  {project?.isArchived ? "Unarchive Project" : "Archive Project"}
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="pt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="transition-all focus:ring-2 focus:ring-indigo-500">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {!saving && <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}