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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input 
              placeholder="Project Name *" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Input 
              placeholder="Project Link (optional)" 
              value={link} 
              onChange={(e) => setLink(e.target.value)}
              type="url"
            />
          </div>
          
          <div>
            <textarea
              placeholder="Project Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-md resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <Input 
              placeholder="Tags (comma-separated, optional)" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Example: frontend, react, urgent
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!name.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}