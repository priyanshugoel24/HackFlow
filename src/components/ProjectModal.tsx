"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import axios from "axios";

export default function ProjectModal({ 
  open, 
  setOpen, 
  onSuccess,
  teamId
}: { 
  open: boolean;
  setOpen: (val: boolean) => void;
  onSuccess?: () => void;
  teamId?: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    setIsLoading(true);
    try {
      await axios.post("/api/projects", { 
        name: name.trim(), 
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
        teamId: teamId || undefined
      });
      
      setOpen(false);
      // Reset form
      setName("");
      setDescription("");
      setTags("");
      onSuccess?.();
    } catch (error: unknown) {
      console.error("Failed to create project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-gray-900 shadow-2xl rounded-xl p-8">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create a New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
            <Input 
              placeholder="Enter project name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
              className="dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Description</label>
            <textarea
              placeholder="Brief description of the project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
            <Input 
              placeholder="e.g. frontend, react, urgent" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)}
              className="dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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