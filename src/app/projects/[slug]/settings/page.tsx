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

export default function ProjectSettingsPage() {
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

        return () => {
          channel.unsubscribe("project:updated", handleProjectUpdate);
          channel.unsubscribe("member:removed");
          channel.unsubscribe("member:added");
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
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-8">Project Settings</h1>

        <section className="border-b border-gray-200 pb-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Project Info</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Project Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg shadow-sm" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-lg shadow-sm" />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Link</label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} className="rounded-lg shadow-sm" />
            </div>
          </div>
        </section>

        <section className="border-b border-gray-200 pb-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Tags</h2>
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag"
              className="flex-1 rounded-lg shadow-sm"
            />
            <Button variant="outline" onClick={handleAddTag}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200 transition-colors rounded-lg px-3 py-1 select-none"
                onClick={() => handleRemoveTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </section>

        {project?.members && (
          <section className="pb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 border-b border-gray-200 pb-2">Team Members</h2>
            <ul className="space-y-3">
              {project.members.map((member: any) => (
                <li
                  key={member.user.id}
                  className="flex items-center justify-between bg-muted px-4 py-2 rounded hover:bg-gray-100 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={member.user.image || "/fallback-avatar.png"}
                      alt={member.user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">{member.user.name || member.user.email}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-100"
                    onClick={async () => {
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

        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {!saving && <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}