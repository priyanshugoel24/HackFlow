"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Trash2,
  Archive,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useCardPresence } from "@/lib/ably/useCardPresence";
import CommentThread from "./CommentThread";
import RichTextEditor from "./RichTextEditor";
import {
  sanitizeText,
  validateInput,
  contextCardSchema,
  validateFileUpload,
} from "@/lib/security";
import { sanitizeHtml } from "@/lib/security-client";
import ExistingCard from "@/interfaces/ExistingCard";
import Project from "@/interfaces/Project";

export default function ContextCardModal({
  open,
  setOpen,
  projectSlug,
  project,
  existingCard,
  onSuccess,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  projectSlug: string;
  project?: Project;
  existingCard?: ExistingCard & { createdById?: string };
  onSuccess?: () => void;
}) {
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
  const [status, setStatus] = useState<"ACTIVE" | "CLOSED">("ACTIVE");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState<
    Array<{ userId: string; name?: string; email?: string; image?: string }>
  >([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState(existingCard?.summary || "");

  // Track original values to detect changes
  const [originalValues, setOriginalValues] = useState<{
    title: string;
    content: string;
    type: "TASK" | "INSIGHT" | "DECISION";
    visibility: "PRIVATE" | "PUBLIC";
    why: string;
    issues: string;
    mention: string;
    existingAttachments: string[];
    status: "ACTIVE" | "CLOSED";
  } | null>(null);

  // Memoize user object to prevent unnecessary re-renders
  const currentUser = useMemo(() => {
    if (!session?.user) return { id: "anonymous", name: "Anonymous" };
    const user = session.user as {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    return {
      id: user.id,
      name: user.name || "Unknown User",
      image: user.image || undefined,
    };
  }, [session?.user]);

  // Check if the current user has permission to archive/unarchive this card
  const canArchive = useMemo(() => {
    if (!existingCard || !session?.user || !project) return false;

    const user = session.user as {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    const isCardCreator = existingCard.userId === user.id;
    const isProjectCreator = project.createdById === user.id;
    const isManager = project.members.some(
      (member) =>
        member.userId === user.id &&
        member.role === "MANAGER" &&
        member.status === "ACTIVE"
    );

    return isCardCreator || isProjectCreator || isManager;
  }, [existingCard, session?.user, project]);

  // Use card presence hook to track who's editing
  const { editors } = useCardPresence(
    existingCard?.id || `new-${projectSlug}`,
    currentUser
  );

  // Filter out current user and only show when modal is open
  const otherEditors = open && session?.user
    ? editors.filter((editor) => {
        const user = session.user as {
          id: string;
          name?: string | null;
            email?: string | null;
            image?: string | null;
          };
          return editor.id !== user.id;
        })
      : [];



  useEffect(() => {
    if (existingCard) {
      const initialValues = {
        title: existingCard.title || "",
        content: existingCard.content || "",
        type: existingCard.type || "TASK",
        visibility: existingCard.visibility || "PRIVATE",
        why: existingCard.why || "",
        issues: existingCard.issues || "",
        mention: existingCard.slackLinks?.[0] || "",
        existingAttachments: existingCard.attachments || [],
        status: existingCard.status || "ACTIVE",
      };

      setTitle(initialValues.title);
      setContent(initialValues.content);
      setType(initialValues.type as "TASK" | "INSIGHT" | "DECISION");
      setVisibility(initialValues.visibility as "PRIVATE" | "PUBLIC");
      setWhy(initialValues.why);
      setIssues(initialValues.issues);
      setStatus(initialValues.status as "ACTIVE" | "CLOSED");
      setMention(initialValues.mention);
      setExistingAttachments(initialValues.existingAttachments);
      setAttachments([]);

      // Store original values for change detection
      setOriginalValues(initialValues);
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
      setOriginalValues(null);
    }
  }, [existingCard, open]);

  // Get project members for mention dropdown
  useEffect(() => {
    if (project && project.members) {
      // Transform the project members into a format suitable for the dropdown
      const members = project.members
        .filter((m) => m.status === "ACTIVE") // Only include active members
        .map((member) => {
          const user =
            (
              member as {
                user?: { name?: string; email?: string; image?: string };
              }
            ).user || {};
          return {
            userId: member.userId,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        });
      setFilteredMembers(members);
    }
  }, [project]);

  // Filter members based on search input
  const filterMembers = (input: string) => {
    if (!project || !project.members) return;

    setMention(input);

    if (!input.trim()) {
      setShowMemberDropdown(false);
      return;
    }

    const searchTerm = input.toLowerCase().trim();
    const members = project.members
      .filter((m) => m.status === "ACTIVE")
      .map((member) => {
        const user =
          (
            member as {
              user?: { name?: string; email?: string; image?: string };
            }
          ).user || {};
        return {
          userId: member.userId,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      })
      .filter(
        (member) =>
          (member.name && member.name.toLowerCase().includes(searchTerm)) ||
          (member.email && member.email.toLowerCase().includes(searchTerm))
      );

    setFilteredMembers(members);
    setShowMemberDropdown(members.length > 0);
  };

  // Handle selecting a member from the dropdown
  const handleSelectMember = (member: {
    userId: string;
    name?: string;
    email?: string;
  }) => {
    setMention(member.name || member.email || member.userId);
    setShowMemberDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMemberDropdown(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Helper function to check if arrays are equal
  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    // Sort both arrays before comparing to handle order differences
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return JSON.stringify(sortedA) === JSON.stringify(sortedB);
  };

  // Check if any values have changed from original
  const hasChanges = () => {
    if (!originalValues || !existingCard) return true; // For new cards or when original values aren't set

    const currentValues = {
      title,
      content,
      type,
      visibility,
      why,
      issues,
      mention,
      existingAttachments,
      status,
    };

    // Check each field for changes
    const changes = {
      title: currentValues.title.trim() !== originalValues.title.trim(),
      content: currentValues.content.trim() !== originalValues.content.trim(),
      type: currentValues.type !== originalValues.type,
      visibility: currentValues.visibility !== originalValues.visibility,
      why:
        (currentValues.why || "").trim() !== (originalValues.why || "").trim(),
      issues:
        (currentValues.issues || "").trim() !==
        (originalValues.issues || "").trim(),
      mention:
        (currentValues.mention || "").trim() !==
        (originalValues.mention || "").trim(),
      status: currentValues.status !== originalValues.status,
      existingAttachments: !arraysEqual(
        currentValues.existingAttachments,
        originalValues.existingAttachments
      ),
      newAttachments: attachments.length > 0,
    };

    const hasAnyChanges = Object.values(changes).some(Boolean);

    if (hasAnyChanges) {
      const changedFields = Object.entries(changes)
        .filter(([, changed]) => changed)
        .map(([field]) => field);
      console.log("📝 Changes detected in fields:", changedFields);
    } else {
      console.log("📝 No changes detected");
    }

    return hasAnyChanges;
  };

  // Validate the form before submission
  const isFormValid = () => {
    return title.trim().length > 0 && content.trim().length > 0;
  };

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
        const errorData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
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

  const handleSummarize = async () => {
    if (!existingCard?.id) return;
    setIsSummarizing(true);
    try {
      const res = await fetch(
        `/api/context-cards/${existingCard.id}/summarize`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: projectSlug,
            cardId: existingCard.id,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSummaryText(data.summary);
        toast.success("Summary generated!");
      } else {
        console.error("Failed to generate summary for card:", existingCard.id, data);
        toast.error("Failed to generate summary", { description: data.error });
      }
    } catch (error) {
      console.error("Error generating summary for card:", existingCard.id, error);
      toast.error("Something went wrong");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;

    // Client-side validation and sanitization
    const sanitizedData = {
      title: sanitizeText(title.trim()),
      content: sanitizeHtml(content.trim()),
      type,
      visibility,
      status,
      why: why ? sanitizeText(why.trim()) : undefined,
      issues: issues ? sanitizeText(issues.trim()) : undefined,
      mention: mention ? sanitizeText(mention.trim()) : undefined,
      projectId: projectSlug,
    };

    // Validate input
    const validationResult = validateInput(contextCardSchema, sanitizedData);
    if (!validationResult.isValid) {
      toast.error("Invalid input", {
        description:
          validationResult.errors?.[0] ||
          "Please check your input and try again",
        duration: 4000,
        position: "top-right",
      });
      setIsLoading(false);
      return;
    }

    // For existing cards, check if there are any changes
    if (existingCard && !hasChanges()) {
      console.log("✅ No changes detected, closing modal without update");
      setOpen(false);
      return;
    }

    setIsLoading(true);
    let notifyUserId = null;

    // Check if we need to notify someone (when a user is mentioned)
    if (mention && mention.trim() && project?.members) {
      // Try to find the mentioned user in project members
      const mentionedMember = project.members.find((m) => {
        const user =
          (m as { user?: { name?: string; email?: string; image?: string } })
            .user || {};
        return user.name === mention.trim() || user.email === mention.trim();
      });
      if (mentionedMember) {
        notifyUserId = mentionedMember.userId;
      }
    }

    try {
      const uploadedUrls: string[] = [...existingAttachments];

      for (const file of attachments) {
        const url = await uploadFileToSupabase(file);
        if (url) uploadedUrls.push(url);
      }

      let res;
      if (existingCard) {
        // Update existing card - only send fields that have actually changed
        console.log("📝 Updating existing card:", existingCard.id);
        const updateData: {
          title?: string;
          content?: string;
          type?: "TASK" | "INSIGHT" | "DECISION";
          visibility?: "PRIVATE" | "PUBLIC";
          status?: "ACTIVE" | "CLOSED";
          why?: string;
          issues?: string;
          slackLinks?: string[];
          attachments?: string[];
          notifyUserId?: string;
        } = {};

        // Only include changed fields with proper trimming and comparison
        if (sanitizedData.title !== originalValues?.title.trim())
          updateData.title = sanitizedData.title;
        if (sanitizedData.content !== originalValues?.content.trim())
          updateData.content = sanitizedData.content;
        if (type !== originalValues?.type) updateData.type = type;
        if (visibility !== originalValues?.visibility)
          updateData.visibility = visibility;
        if (status !== originalValues?.status) updateData.status = status;
        if ((sanitizedData.why || "") !== (originalValues?.why || "").trim())
          updateData.why = sanitizedData.why;
        if (
          (sanitizedData.issues || "") !== (originalValues?.issues || "").trim()
        )
          updateData.issues = sanitizedData.issues;
        if (
          (sanitizedData.mention || "") !==
          (originalValues?.mention || "").trim()
        )
          updateData.slackLinks = sanitizedData.mention
            ? [sanitizedData.mention]
            : [];
        if (
          !arraysEqual(uploadedUrls, originalValues?.existingAttachments || [])
        ) {
          updateData.attachments = uploadedUrls;
        }

        // Only make API call if there are actual changes to send
        if (Object.keys(updateData).length === 0) {
          console.log("✅ No changes to send to server, closing modal");
          setOpen(false);
          setIsLoading(false);
          return;
        }

        // Include notification info if someone is mentioned
        if (notifyUserId) {
          updateData.notifyUserId = notifyUserId;
        }

        res = await fetch(`/api/context-cards/${existingCard.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });
      } else {
        // Create new card
        console.log("✨ Creating new card");
        const formData = new FormData();
        formData.append("title", sanitizedData.title);
        formData.append("content", sanitizedData.content);
        formData.append("projectId", projectSlug);
        formData.append("type", type);
        formData.append("visibility", visibility);
        formData.append("status", status);
        if (sanitizedData.why) formData.append("why", sanitizedData.why);
        if (sanitizedData.issues)
          formData.append("issues", sanitizedData.issues);
        if (sanitizedData.mention)
          formData.append("mention", sanitizedData.mention);
        for (const file of attachments) {
          formData.append("attachments", file);
        }
        existingAttachments.forEach((url) => {
          formData.append("existingAttachments", url);
        });

        // Include notification info if someone is mentioned
        if (notifyUserId) {
          formData.append("notifyUserId", notifyUserId);
        }

        res = await fetch("/api/context-cards", {
          method: "POST",
          body: formData,
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
      case "INSIGHT":
        return <Lightbulb className="h-4 w-4" />;
      case "DECISION":
        return <CheckCircle className="h-4 w-4" />;
      case "TASK":
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const removeExistingAttachment = (url: string) => {
    setExistingAttachments(existingAttachments.filter((att) => att !== url));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val && existingCard && hasChanges()) {
          // If closing modal with unsaved changes, show a warning or save them
          const shouldSave = confirm(
            "You have unsaved changes. Would you like to save them before closing?"
          );
          if (shouldSave) {
            handleSubmit();
          } else {
            setOpen(val);
          }
        } else {
          setOpen(val);
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto bg-background rounded-xl shadow-xl p-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-8"
        >
          <DialogHeader className="mb-2">
            <DialogTitle className="sr-only">
              {/* {existingCard ? "Edit Note" : "Add a New Note"} */}
            </DialogTitle>

            {/* Show currently editing users */}
            {otherEditors.length > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Currently editing:
                </span>
                <div className="flex -space-x-3">
                  {otherEditors
                    .slice(0, 3) // Show max 3 avatars
                    .map((editor) => (
                      <div
                        key={editor.id}
                        className="relative w-8 h-8 rounded-full border-3 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shadow-sm"
                        title={`${editor.name} is editing`}
                      >
                        {editor.image ? (
                          <img
                            src={editor.image}
                            alt={editor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {editor.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {/* Online indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      </div>
                    ))}
                  {otherEditors.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-3 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm">
                      +{otherEditors.length - 3}
                    </div>
                  )}
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  {otherEditors.length} user
                  {otherEditors.length !== 1 ? "s" : ""} editing
                </span>
              </div>
            )}
          </DialogHeader>
          <div className="flex items-center justify-between mb-6">
            <input
              className="text-xl font-medium w-full placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 bg-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 rounded px-2 py-1 cursor-pointer"
              placeholder="Card title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => setTitle(sanitizeText(e.target.value))}
            />
            {existingCard && canArchive && (
              <div className="flex items-center space-x-3 ml-4">
                <button
                  onClick={async () => {
                    const action = existingCard.isArchived
                      ? "unarchive"
                      : "archive";
                    if (
                      !confirm(`Are you sure you want to ${action} this card?`)
                    )
                      return;
                    try {
                      const res = await fetch(
                        `/api/context-cards/${existingCard.id}/archive`,
                        {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            isArchived: !existingCard.isArchived,
                          }),
                        }
                      );
                      if (res.ok) {
                        setOpen(false);
                        onSuccess?.();
                        toast.success(`Card ${action}d`, {
                          description: `The context card has been ${action}d.`,
                          duration: 4000,
                          position: "top-right",
                        });
                      } else {
                        const errorData = await res.json();
                        console.error(`Failed to ${action} card:`, errorData);
                        toast.error(`Failed to ${action} card`, {
                          description:
                            errorData.error ||
                            `Unable to ${action} the card. Please try again later.`,
                          duration: 4000,
                          position: "top-right",
                        });
                      }
                    } catch (err) {
                      console.error(`Error ${action}ing card:`, err);
                    }
                  }}
                  title={
                    existingCard.isArchived ? "Unarchive Card" : "Archive Card"
                  }
                >
                  <Archive
                    className={`h-5 w-5 cursor-pointer ${
                      existingCard.isArchived
                        ? "text-green-600 hover:text-green-800"
                        : "text-orange-600 hover:text-orange-800"
                    }`}
                  />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete this card?"))
                      return;
                    try {
                      const res = await fetch(
                        `/api/context-cards/${existingCard.id}`,
                        {
                          method: "DELETE",
                        }
                      );
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
                          description:
                            "Unable to remove the card. Please try again later.",
                          duration: 4000,
                          position: "top-right",
                        });
                      }
                    } catch (err) {
                      console.error("Error deleting card:", err);
                    }
                  }}
                  title="Delete Card"
                >
                  <Trash2 className="h-5 w-5 text-red-600 hover:text-red-800 cursor-pointer" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Content *
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Add your context content here... Support for **bold**, *italic*, [links](url), lists, and more!"
              className="focus-within:ring-2 focus-within:ring-yellow-400 dark:focus-within:ring-yellow-500"
              minHeight={120}
              initialPreview={!!existingCard}
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
            <div className="space-y-3 flex-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {["TASK", "INSIGHT", "DECISION"].map((cardType) => (
                  <Badge
                    key={cardType}
                    onClick={() =>
                      setType(cardType as "TASK" | "INSIGHT" | "DECISION")
                    }
                    className={`px-3 py-2 rounded-full text-xs font-semibold ${
                      type === cardType
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    } cursor-pointer`}
                  >
                    {getTypeIcon(cardType)} {cardType}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Visibility
              </label>
              <div className="flex gap-2 flex-wrap">
                {["PRIVATE", "PUBLIC"].map((vis) => (
                  <Badge
                    key={vis}
                    onClick={() => setVisibility(vis as "PRIVATE" | "PUBLIC")}
                    className={`px-3 py-2 rounded-full text-xs font-semibold ${
                      visibility === vis
                        ? vis === "PRIVATE"
                          ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                          : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
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
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Task Status
              </label>
              <div className="flex gap-2">
                {["ACTIVE", "CLOSED"].map((statusOption) => (
                  <Badge
                    key={statusOption}
                    onClick={() =>
                      setStatus(statusOption as "ACTIVE" | "CLOSED")
                    }
                    className={`px-3 py-2 rounded-full text-xs font-semibold ${
                      status === statusOption
                        ? statusOption === "ACTIVE"
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
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

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Why is this important? (optional)
            </label>
            <textarea
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              onBlur={(e) => setWhy(sanitizeText(e.target.value))}
              placeholder="Explain why this is important..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-base text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Any blockers/issues? (optional)
            </label>
            <textarea
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              onBlur={(e) => setIssues(sanitizeText(e.target.value))}
              placeholder="Describe any blockers or issues..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-base text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3 relative">
            <AtSign className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <div className="w-full relative">
              <input
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-md p-3 text-base text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500 cursor-pointer"
                placeholder="Mention team member (optional)"
                value={mention}
                onChange={(e) => filterMembers(e.target.value)}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMemberDropdown(filteredMembers.length > 0);
                }}
              />

              {showMemberDropdown && filteredMembers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.userId}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMember(member);
                      }}
                    >
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name || member.email || "User"}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                          {member.name ? member.name[0].toUpperCase() : "@"}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {member.name || "User"}
                        </div>
                        {member.email && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {member.email}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Existing attachments preview */}
          {existingAttachments.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Existing Attachments
              </label>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {existingAttachments.map((url, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between py-1"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
                    >
                      {url.split("/").pop()}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(url)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 ml-2"
                      aria-label="Remove attachment"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <input
              type="file"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const validFiles: File[] = [];

                for (const file of files) {
                  const validation = validateFileUpload(file);
                  if (validation.isValid) {
                    validFiles.push(file);
                  } else {
                    toast.error(`File "${file.name}" rejected`, {
                      description: validation.error,
                      duration: 4000,
                      position: "top-right",
                    });
                  }
                }

                setAttachments((prev) => [...prev, ...validFiles]);
              }}
              className="text-sm text-gray-600 dark:text-gray-400 flex-1"
            />
          </div>

          {/* New attachments preview */}
          {attachments.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                New Attachments
              </label>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                {attachments.map((file, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="truncate max-w-xs text-sm">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments(attachments.filter((_, i) => i !== idx))
                      }
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 ml-2"
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
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
                className="px-6 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || isLoading}
                className="bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white px-6 py-2"
              >
                {isLoading ? "Creating..." : "Create Card"}
              </Button>
            </div>
          )}

          {existingCard && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div>
                {/* Confirmation of card status */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {existingCard.isArchived ? (
                    <span className="flex items-center text-amber-600 dark:text-amber-400">
                      <Archive className="h-4 w-4 mr-1" /> Archived
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSummarize}
                  disabled={isSummarizing || !existingCard}
                  className="text-sm"
                >
                  {isSummarizing ? "Summarizing..." : "Generate Summary"}
                </Button>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isLoading || !hasChanges()}
                  className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 py-2"
                >
                  {isLoading ? "Updating..." : "Update Card"}
                </Button>
              </div>
            </div>
          )}

          {existingCard && summaryText && (
            <div className="mt-6 p-4 rounded-md border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <h4 className="text-sm font-semibold mb-2 text-yellow-700 dark:text-yellow-300">
                AI Summary
              </h4>
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                {summaryText}
              </p>
            </div>
          )}

          {existingCard && (
            <div className="pt-6 border-t border-gray-200 dark:border-gray-600 mt-8">
              <CommentThread cardId={existingCard.id} />
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
