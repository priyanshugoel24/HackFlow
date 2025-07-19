"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { getAblyClient } from "@/lib/ably";
import { useSession } from "next-auth/react";
import axios from "axios";

interface ProjectSettingsPageClientProps {
  project: any;
  projectSlug: string;
}

export default function ProjectSettingsPageClient({ 
  project: initialProject, 
  projectSlug 
}: ProjectSettingsPageClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<any>(initialProject);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialProject.name || "");
  const [description, setDescription] = useState(initialProject.description || "");
  const [link, setLink] = useState(initialProject.link || "");
  const [tags, setTags] = useState<string[]>(initialProject.tags || []);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    // Set up real-time subscriptions
    const ably = getAblyClient();
    const channel = ably.channels.get(`project:${project.id}`);

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

    return () => {
      // Unsubscribe from all events
      channel.unsubscribe("project:updated", handleProjectUpdate);
      
      // Properly handle channel cleanup
      const cleanupChannel = async () => {
        try {
          // Only detach if the channel is in attached state
          if (channel.state === 'attached') {
            await channel.detach();
          }
          
          // Wait for state to settle
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Release the channel only if it's in a releasable state
          if (channel.state === 'detached' || channel.state === 'failed' || channel.state === 'initialized') {
            ably.channels.release(`project:${project.id}`);
          }
        } catch (error) {
          console.warn('Error during channel cleanup:', error);
          // Don't force release if there's an error, let Ably handle it
        }
      };
      
      cleanupChannel();
    };
  }, [project.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch(`/api/projects/${projectSlug}`, {
        name,
        description,
        link,
        tags
      });
      toast.success("Project updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error updating project");
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

  return (
    <div className="bg-background min-h-screen py-16 px-6 sm:px-8 md:px-12">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Project
        </Button>
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
              {/* Only show if user is project creator */}
              {project?.createdById === (session?.user as any)?.id && (
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
                      await axios.patch(`/api/projects/${project.id}/archive`, {
                        isArchived: !project.isArchived,
                      });
                      setProject({
                        ...project,
                        isArchived: !project.isArchived,
                      });
                      toast.success(`Project ${action}d`, {
                        description: `The project has been ${action}d successfully.`,
                      });
                    } catch (error: any) {
                      console.error(`Error ${action}ing project:`, error);
                      toast.error(`Error ${action}ing project`, {
                        description: error.response?.data?.error || "An unexpected error occurred. Please try again.",
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
