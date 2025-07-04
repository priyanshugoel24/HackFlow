"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { FileText, Lightbulb, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ContextCardModal({ 
  open, 
  setOpen, 
  projectId,
  onSuccess 
}: { 
  open: boolean;
  setOpen: (val: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"TASK" | "INSIGHT" | "DECISION">("TASK");
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [why, setWhy] = useState("");
  const [issues, setIssues] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/context-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: title.trim(),
          content: content.trim(),
          projectId,
          type,
          visibility,
          why: why.trim() || undefined,
          issues: issues.trim() || undefined,
        }),
      });
      
      if (response.ok) {
        setOpen(false);
        // Reset form
        setTitle("");
        setContent("");
        setType("TASK");
        setVisibility("PRIVATE");
        setWhy("");
        setIssues("");
        onSuccess?.();
      } else {
        console.error("Failed to create context card");
      }
    } catch (error) {
      console.error("Error creating context card:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (cardType: string) => {
    switch (cardType) {
      case 'INSIGHT': return <Lightbulb className="h-4 w-4" />;
      case 'DECISION': return <CheckCircle className="h-4 w-4" />;
      case 'TASK': 
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Context Card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Input 
              placeholder="Card Title *" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <textarea
              placeholder="Content *"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded-md resize-none"
              rows={4}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-2">
              {(['TASK', 'INSIGHT', 'DECISION'] as const).map((cardType) => (
                <button
                  key={cardType}
                  onClick={() => setType(cardType)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors ${
                    type === cardType 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {getTypeIcon(cardType)}
                  <span className="text-sm capitalize">{cardType.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <div className="flex gap-2">
              {(['PRIVATE', 'PUBLIC'] as const).map((vis) => (
                <button
                  key={vis}
                  onClick={() => setVisibility(vis)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md border transition-colors ${
                    visibility === vis 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {vis === 'PRIVATE' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span className="text-sm capitalize">{vis.toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <textarea
              placeholder="Why is this important? (optional)"
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              className="w-full p-2 border rounded-md resize-none"
              rows={2}
            />
          </div>
          
          <div>
            <textarea
              placeholder="Issues or blockers (optional)"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              className="w-full p-2 border rounded-md resize-none"
              rows={2}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmit} 
              disabled={!title.trim() || !content.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Card"}
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
