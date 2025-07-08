"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ProjectModal({ 
  open, 
  setOpen, 
  onSuccess 
}: { 
  open: boolean;
  setOpen: (val: boolean) => void;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          link: link.trim() || undefined,
          description: description.trim() || undefined,
          tags: tags.trim() ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : []
        }),
      });
      
      if (response.ok) {
        setOpen(false);
        // Reset form
        setName("");
        setLink("");
        setDescription("");
        setTags("");
        onSuccess?.();
      } else {
        console.error("Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl bg-white shadow-2xl rounded-xl p-8">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create a New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <Input 
              placeholder="Enter project name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Link</label>
            <Input 
              placeholder="https://your-project.com" 
              value={link} 
              onChange={(e) => setLink(e.target.value)}
              type="url"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
            <textarea
              placeholder="Brief description of the project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <Input 
              placeholder="e.g. frontend, react, urgent" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Separate tags with commas
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}