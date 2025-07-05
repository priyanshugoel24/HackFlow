"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Lightbulb,
  CheckCircle,
  Eye,
  EyeOff,
  Paperclip,
  AtSign,
  Tag
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

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
  // const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [mention, setMention] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(false);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = "auto";
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("content", content.trim());
    formData.append("projectId", projectId);
    formData.append("type", type);
    formData.append("visibility", visibility);
    if (why) formData.append("why", why);
    if (issues) formData.append("issues", issues);
    if (mention) formData.append("mention", mention);
    // tags.forEach(tag => formData.append("tags", tag));
    attachments.forEach(file => formData.append("attachments", file));

    try {
      const response = await fetch("/api/context-cards", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        setOpen(false);
        setTitle("");
        setContent("");
        setType("TASK");
        setVisibility("PRIVATE");
        setWhy("");
        setIssues("");
        // setTags([]);
        setNewTag("");
        setMention("");
        setAttachments([]);
        setPreview(false);
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
      <DialogContent className="sm:max-w-2xl bg-white rounded-xl shadow-xl p-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-800">Add a New Note</DialogTitle>
          </DialogHeader>

          <input
            className="text-2xl font-semibold w-full placeholder-gray-400 focus:outline-none"
            placeholder="Card title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="relative">
            {!preview ? (
              <textarea
                ref={contentRef}
                className="w-full text-sm text-gray-700 placeholder:text-gray-500 focus:outline-none resize-none"
                rows={4}
                placeholder="Add your context *"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div className="p-3 rounded-md bg-gray-50 border text-sm prose max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
            <button
              onClick={() => setPreview((prev) => !prev)}
              className="absolute top-0 right-0 mt-1 mr-1 text-xs text-blue-600 hover:underline"
            >
              {preview ? "Edit" : "Preview"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-2">
                {["TASK", "INSIGHT", "DECISION"].map((cardType) => (
                  <Badge
                    key={cardType}
                    onClick={() => setType(cardType as any)}
                    className={`cursor-pointer px-2 py-1 rounded-full ${type === cardType ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
                  >
                    {getTypeIcon(cardType)} {cardType.toLowerCase()}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Visibility</label>
              <div className="flex gap-2">
                {["PRIVATE", "PUBLIC"].map((vis) => (
                  <Badge
                    key={vis}
                    onClick={() => setVisibility(vis as any)}
                    className={`cursor-pointer px-2 py-1 rounded-full ${visibility === vis ? (vis === "PRIVATE" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700") : "bg-gray-100 text-gray-600"}`}
                  >
                    {vis === "PRIVATE" ? <EyeOff className="h-4 w-4 inline-block mr-1" /> : <Eye className="h-4 w-4 inline-block mr-1" />} {vis.toLowerCase()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <textarea
            className="w-full bg-gray-50 border p-2 rounded text-sm placeholder-gray-500 focus:outline-none resize-none"
            rows={2}
            placeholder="Why is this important? (optional)"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />

          <textarea
            className="w-full bg-gray-50 border p-2 rounded text-sm placeholder-gray-500 focus:outline-none resize-none"
            rows={2}
            placeholder="Any blockers/issues? (optional)"
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <AtSign className="h-4 w-4 text-gray-500" />
            <input
              className="w-full border rounded p-2 text-sm focus:outline-none"
              placeholder="Mention team member (optional)"
              value={mention}
              onChange={(e) => setMention(e.target.value)}
            />
          </div>

          {/* <div className="flex flex-wrap items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <input
              className="border rounded p-2 text-sm focus:outline-none"
              placeholder="Add tag and press Enter"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTag.trim()) {
                  e.preventDefault();
                  setTags([...tags, newTag.trim()]);
                  setNewTag("");
                }
              }}
            />
            {tags.map((tag, i) => (
              <Badge
                key={i}
                className="bg-blue-100 text-blue-700 text-xs px-2"
                onClick={() => setTags(tags.filter((t) => t !== tag))}
              >
                {tag} ✕
              </Badge>
            ))}
          </div> */}

          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <input
              type="file"
              multiple
              onChange={(e) => setAttachments(Array.from(e.target.files || []))}
              className="text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !content.trim() || isLoading}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isLoading ? "Creating..." : "Create Card"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}