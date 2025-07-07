"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileText,
  Lightbulb,
  CheckCircle,
  Eye,
  EyeOff,
  Paperclip,
  AtSign,
  Tag,
  Trash2
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSession } from "next-auth/react";
import { useCardPresence } from "@/lib/ably/useCardPresence";

export default function ContextCardModal({
  open,
  setOpen,
  projectSlug,
  existingCard,
  onSuccess
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  projectSlug: string;
  existingCard?: any;
  onSuccess?: () => void;
}) {
  const supabase = createClientComponentClient();
  const { data: session } = useSession();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"TASK" | "INSIGHT" | "DECISION">("TASK");
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [why, setWhy] = useState("");
  const [issues, setIssues] = useState("");
  const [mention, setMention] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(existingCard ? true : false);
  const [status, setStatus] = useState<"ACTIVE" | "CLOSED">("ACTIVE");

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Memoize user object to prevent unnecessary re-renders
  const currentUser = useMemo(() => {
    if (!session?.user) return { id: "anonymous", name: "Anonymous" };
    return {
      id: session.user.id,
      name: session.user.name || "Unknown User",
      image: session.user.image || undefined
    };
  }, [session?.user?.id, session?.user?.name, session?.user?.image]);

  // Use card presence hook to track who's editing
  const { editors } = useCardPresence(
    existingCard?.id || `new-${projectSlug}`, 
    currentUser
  );

  // Filter out current user and only show when modal is open
  const otherEditors = open && session?.user ? 
    editors.filter(editor => editor.id !== session.user.id) : 
    [];

  // Debug logging
  console.log("🔍 ContextCardModal presence debug:", {
    open,
    editorsCount: editors.length,
    otherEditorsCount: otherEditors.length,
    currentUserId: session?.user?.id,
    cardId: existingCard?.id || `new-${projectSlug}`,
    editors: editors.map(e => ({ id: e.id, name: e.name, hasImage: !!e.image }))
  });

  useEffect(() => {
    if (existingCard) {
      setTitle(existingCard.title || "");
      setContent(existingCard.content || "");
      setType(existingCard.type || "TASK");
      setVisibility(existingCard.visibility || "PRIVATE");
      setWhy(existingCard.why || "");
      setIssues(existingCard.issues || "");
      setStatus(existingCard.status || "ACTIVE");
      setMention(existingCard.slackLinks?.[0] || "");
      setExistingAttachments(existingCard.attachments || []);
      setAttachments([]);
    } else {
      setTitle("");
      setContent("");
      setType("TASK");
      setVisibility("PRIVATE");
      setWhy("");
      setIssues("");
      setStatus("ACTIVE");
      setMention("");
      setAttachments([]);
      setExistingAttachments([]);
    }
  }, [existingCard, open]);

  // Upload file via API route to avoid exposing service key and for SSR security
  const uploadFileToSupabase = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Upload API error:", errorData);
        toast.error(`Upload failed: ${errorData.error || "Unknown error"}`, {
          description: `Failed to upload ${file.name}`,
          duration: 4000,
          position: "top-right",
        });
        return null;
      }
      const data = await res.json();
      return data.url;
    } catch (error) {
      console.error("Upload API error:", error);
      toast.error("Upload failed", {
        description: `Network error while uploading ${file.name}`,
        duration: 4000,
        position: "top-right",
      });
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsLoading(true);

    try {
      const uploadedUrls: string[] = [...existingAttachments];

      for (const file of attachments) {
        const url = await uploadFileToSupabase(file);
        if (url) uploadedUrls.push(url);
      }

      // Use FormData for file uploads and other fields
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("projectId", projectSlug);
      formData.append("type", type);
      formData.append("visibility", visibility);
      formData.append("status", status);
      if (why) formData.append("why", why);
      if (issues) formData.append("issues", issues);
      if (mention) formData.append("mention", mention);
      for (const file of attachments) {
        formData.append("attachments", file);
      }
      existingAttachments.forEach((url) => {
        formData.append("existingAttachments", url);
      });

      let res;
      if (existingCard) {
        // Update existing card
        console.log("📝 Updating existing card:", existingCard.id);
        const updateData = {
          title,
          content,
          type,
          visibility,
          status,
          why: why || undefined,
          issues: issues || undefined,
          slackLinks: mention ? [mention] : [],
          attachments: uploadedUrls
        };

        res = await fetch(`/api/context-cards/${existingCard.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData)
        });
      } else {
        // Create new card
        console.log("✨ Creating new card");
        res = await fetch("/api/context-cards", {
          method: "POST",
          body: formData
        });
      }

      if (res.ok) {
        const responseData = await res.json();
        console.log("📊 Response data:", responseData);
        
        setOpen(false);
        onSuccess?.();
        toast.success(existingCard ? "Card updated" : "Card created", {
          description: existingCard
            ? "Your changes have been saved successfully."
            : "A new context card has been created.",
          duration: 4000,
          position: "top-right",
        });
        // Reset form only if creating new card
        if (!existingCard) {
          setTitle("");
          setContent("");
          setType("TASK");
          setVisibility("PRIVATE");
          setWhy("");
          setIssues("");
          setMention("");
          setAttachments([]);
          setExistingAttachments([]);
          setStatus("ACTIVE");
          setPreview(false);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Failed to save context card:", errorData);
        toast.error("Failed to save context card", {
          description: "Something went wrong while saving. Please try again.",
          duration: 4000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error saving context card:", error);
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

  const removeExistingAttachment = (url: string) => {
    setExistingAttachments(existingAttachments.filter((att) => att !== url));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && existingCard) handleSubmit();
        setOpen(val);
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto bg-white rounded-xl shadow-xl p-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          <DialogHeader className="mb-2">
            <DialogTitle className="sr-only">
              {/* {existingCard ? "Edit Note" : "Add a New Note"} */}
            </DialogTitle>
            
            {/* Show currently editing users */}
            {otherEditors.length > 0 && (
              <div className="flex items-center gap-3 mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-blue-700">Currently editing:</span>
                <div className="flex -space-x-3">
                  {otherEditors
                    .slice(0, 3) // Show max 3 avatars
                    .map((editor) => (
                    <div
                      key={editor.id}
                      className="relative w-8 h-8 rounded-full border-3 border-white bg-gray-100 flex items-center justify-center overflow-hidden shadow-sm"
                      title={`${editor.name} is editing`}
                    >
                      {editor.image ? (
                        <img
                          src={editor.image}
                          alt={editor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-gray-700">
                          {editor.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                  ))}
                  {otherEditors.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-3 border-white bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600 shadow-sm">
                      +{otherEditors.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-blue-600">
                  {otherEditors.length} user{otherEditors.length !== 1 ? 's' : ''} editing
                </span>
              </div>
            )}
            
            {/* Debug info - remove after testing
            {open && (
              <div className="text-xs text-gray-400 mb-2">
                Debug: {editors.length} total editors, {otherEditors.length} others, Card: {existingCard?.id || `new-${projectSlug}`}
              </div>
            )} */}
          </DialogHeader>
          <div className="flex items-center justify-between">
            <input
              className="text-xl font-medium w-full placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded cursor-pointer"
              placeholder="Card title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {existingCard && (
              <button
                onClick={async () => {
                  if (!confirm("Are you sure you want to delete this card?")) return;
                  try {
                    const res = await fetch(`/api/context-cards/${existingCard.id}`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      setOpen(false);
                      onSuccess?.();
                      toast.success("Card deleted", {
                        description: "The context card has been removed.",
                        duration: 4000,
                        position: "top-right",
                      });
                    } else {
                      console.error("Failed to delete card");
                      toast.error("Failed to delete card", {
                        description: "Unable to remove the card. Please try again later.",
                        duration: 4000,
                        position: "top-right",
                      });
                    }
                  } catch (err) {
                    console.error("Error deleting card:", err);
                  }
                }}
                title="Delete Card"
                className="ml-2"
              >
                <Trash2 className="h-5 w-5 text-red-600 hover:text-red-800 cursor-pointer" />
              </button>
            )}
          </div>

          <div className="relative">
            {!preview ? (
              <textarea
                ref={contentRef}
                className="w-full text-base text-gray-800 placeholder:text-gray-400 bg-gray-50 border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
                rows={3}
                placeholder="Add your context *"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div className="p-2 rounded-md bg-gray-50 border text-sm prose max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
            <button
              onClick={() => setPreview((prev) => !prev)}
              className="absolute top-0 right-0 mt-1 mr-1 text-xs text-blue-600 hover:underline cursor-pointer"
              type="button"
            >
              {preview ? "Edit" : "Preview"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="space-y-2 w-full">
              <label className="text-sm font-semibold text-gray-700">Type</label>
              <div className="flex gap-2 flex-wrap">
                {["TASK", "INSIGHT", "DECISION"].map((cardType) => (
                  <Badge
                    key={cardType}
                    onClick={() => setType(cardType as any)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      type === cardType
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    } cursor-pointer`}
                  >
                    {getTypeIcon(cardType)} {cardType}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2 w-full">
              <label className="text-sm font-semibold text-gray-700">Visibility</label>
              <div className="flex gap-2 flex-wrap">
                {["PRIVATE", "PUBLIC"].map((vis) => (
                  <Badge
                    key={vis}
                    onClick={() => setVisibility(vis as any)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      visibility === vis
                        ? vis === "PRIVATE"
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    } cursor-pointer`}
                  >
                    {vis === "PRIVATE" ? (
                      <EyeOff className="h-4 w-4 inline-block mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 inline-block mr-1" />
                    )}
                    {vis}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {type === "TASK" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Task Status</label>
              <div className="flex gap-2">
                {["ACTIVE", "CLOSED"].map((statusOption) => (
                  <Badge
                    key={statusOption}
                    onClick={() => setStatus(statusOption as any)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      status === statusOption
                        ? statusOption === "ACTIVE"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-300 text-gray-800"
                        : "bg-gray-100 text-gray-600"
                    } cursor-pointer`}
                  >
                    {statusOption === "ACTIVE" ? (
                      <div>
                        <CheckCircle className="h-4 w-4 inline-block mr-1" />
                        <span>Active</span>
                      </div>
                    ) : (
                      <div>
                        <EyeOff className="h-4 w-4 inline-block mr-1" />
                        <span>Closed</span>
                      </div>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <textarea
            className="w-full bg-gray-50 border p-3 rounded-md text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            rows={3}
            placeholder="Why is this important? (optional)"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />

          <textarea
            className="w-full bg-gray-50 border p-3 rounded-md text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            rows={3}
            placeholder="Any blockers/issues? (optional)"
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
          />

          <div className="flex items-center gap-2">
            <AtSign className="h-4 w-4 text-gray-500" />
            <input
              className="w-full border rounded-md p-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
              placeholder="Mention team member (optional)"
              value={mention}
              onChange={(e) => setMention(e.target.value)}
            />
          </div>

          {/* Existing attachments preview */}
          {existingAttachments.length > 0 && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Existing Attachments</label>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {existingAttachments.map((url, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-xs"
                    >
                      {url.split('/').pop()}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(url)}
                      className="text-red-600 hover:text-red-800 ml-2"
                      aria-label="Remove attachment"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <input
              type="file"
              multiple
              onChange={(e) =>
                setAttachments((prev) => [
                  ...prev,
                  ...Array.from(e.target.files || []),
                ])
              }
              className="text-sm text-gray-600"
            />
          </div>

          {/* New attachments preview */}
          {attachments.length > 0 && (
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">New Attachments</label>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {attachments.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span className="truncate max-w-xs text-sm">{file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments(attachments.filter((_, i) => i !== idx))
                      }
                      className="text-red-600 hover:text-red-800 ml-2"
                      aria-label="Remove attachment"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!existingCard && (
            <div className="flex justify-end gap-2 mt-4">
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
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}