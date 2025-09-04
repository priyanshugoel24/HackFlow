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
  Eye,
  EyeOff,
  Paperclip,
  Trash2,
  Archive,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  sanitizeText,
  validateInput,
  contextCardSchema,
  validateFileUpload,
} from "@/lib/security";
import { sanitizeHtml } from "@/lib/security-client";
import { ContextCardModalProps } from "@/interfaces/ContextCardModalProps";
import { GitHubCardAutoFill } from "../GithubCardAutofill";
import axios from "axios";
import { ErrorBoundary } from "@/components";
import { ComponentLoadingSpinner } from "../LoadingSpinner";
import { CARD_TYPES, VISIBILITY_OPTIONS, STATUS_OPTIONS } from "@/config/contextCard";
import { getTypeIcon, getUserAvatarFallback } from "@/utils/contextCard";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { uploadFileToSupabase, TeamMember } from "@/services/contextCardService";

// Lazy load heavy components
const CommentThread = dynamic(() => import('../CommentThread'), {
  loading: () => <ComponentLoadingSpinner text="Loading comments..." />
});

const RichTextEditor = dynamic(() => import('../RichTextEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-gray-500 dark:text-gray-400 animate-pulse">
      Loading editor...
    </div>
  )
});

const ContextCardModal = memo(function ContextCardModal({
  open,
  setOpen,
  projectSlug,
  existingCard,
  onSuccess,
}: ContextCardModalProps) {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"TASK" | "INSIGHT" | "DECISION">("TASK");
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [why, setWhy] = useState("");
  const [issues, setIssues] = useState("");
  const [assignedTo, setAssignedTo] = useState<{
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"ACTIVE" | "CLOSED">("ACTIVE");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState(existingCard?.summary || "");

  // Use custom hooks
  const {
    filteredMembers,
    showMemberDropdown,
    setShowMemberDropdown,
    handleAssignmentSearch,
  } = useTeamMembers(projectSlug, open);

  // Track original values to detect changes
  const [originalValues, setOriginalValues] = useState<{
    title: string;
    content: string;
    type: "TASK" | "INSIGHT" | "DECISION";
    visibility: "PRIVATE" | "PUBLIC";
    why: string;
    issues: string;
    assignedTo: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    } | null;
    existingAttachments: string[];
    status: "ACTIVE" | "CLOSED";
  } | null>(null);

  // Memoize expensive computations
  const computedValues = useMemo(() => {
    const hasAnyChanges = (() => {
      if (!originalValues || !existingCard) return true;

      const currentValues = {
        title: title.trim(),
        content: content.trim(),
        type,
        visibility,
        why: (why || "").trim(),
        issues: (issues || "").trim(),
        assignedTo,
        existingAttachments,
        status,
      };

      const arraysEqual = (a: string[], b: string[]) => {
        if (a.length !== b.length) return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return JSON.stringify(sortedA) === JSON.stringify(sortedB);
      };

      const assignedToChanged = () => {
        const currentAssigned = currentValues.assignedTo;
        const originalAssigned = originalValues.assignedTo;
        
        // Both null/undefined
        if (!currentAssigned && !originalAssigned) return false;
        
        // One null, one not
        if (!currentAssigned || !originalAssigned) return true;
        
        // Compare IDs
        return currentAssigned.id !== originalAssigned.id;
      };

      return (
        currentValues.title !== originalValues.title.trim() ||
        currentValues.content !== originalValues.content.trim() ||
        currentValues.type !== originalValues.type ||
        currentValues.visibility !== originalValues.visibility ||
        currentValues.why !== (originalValues.why || "").trim() ||
        currentValues.issues !== (originalValues.issues || "").trim() ||
        assignedToChanged() ||
        currentValues.status !== originalValues.status ||
        !arraysEqual(currentValues.existingAttachments, originalValues.existingAttachments) ||
        attachments.length > 0
      );
    })();

    const isValid = title.trim().length > 0 && content.trim().length > 0;

    return { hasAnyChanges, isValid };
  }, [title, content, type, visibility, why, issues, assignedTo, status, existingAttachments, attachments, originalValues, existingCard]);

  // Check if the current user has permission to archive/unarchive this card
  const canArchive = useMemo(() => {
    if (!existingCard || !session?.user) {
      return false;
    }

    const user = session.user as {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    
    // Check if user is card creator (by user ID - this is the main creator field)
    const isCardCreator = existingCard.userId === user.id;

    return isCardCreator;
  }, [existingCard, session?.user]);

  useEffect(() => {
    if (existingCard) {
      const initialValues = {
        title: existingCard.title || "",
        content: existingCard.content || "",
        type: existingCard.type || "TASK",
        visibility: existingCard.visibility || "PRIVATE",
        why: existingCard.why || "",
        issues: existingCard.issues || "",
        existingAttachments: existingCard.attachments || [],
        status: existingCard.status || "ACTIVE",
        assignedTo: existingCard.assignedTo ? {
          id: existingCard.assignedTo.id,
          name: existingCard.assignedTo.name,
          email: existingCard.assignedTo.email,
          image: existingCard.assignedTo.image,
        } : null,
      };

      setTitle(initialValues.title);
      setContent(initialValues.content);
      setType(initialValues.type as "TASK" | "INSIGHT" | "DECISION");
      setVisibility(initialValues.visibility as "PRIVATE" | "PUBLIC");
      setWhy(initialValues.why);
      setIssues(initialValues.issues);
      setStatus(initialValues.status as "ACTIVE" | "CLOSED");
      setExistingAttachments(initialValues.existingAttachments);
      setAttachments([]);
      setAssignedTo(initialValues.assignedTo);

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
      setAttachments([]);
      setExistingAttachments([]);
      setAssignedTo(null);
      setOriginalValues(null);
    }
  }, [existingCard, open]);

  // Handle assignment selection
  const handleAssignmentSelect = useCallback((member: TeamMember) => {
    setAssignedTo({
      id: member.userId,
      name: member.name || null,
      email: member.email || null,
      image: member.image || null,
    });
    setShowMemberDropdown(false);
  }, [setShowMemberDropdown]);

  // Handle assignment removal
  const handleAssignmentRemove = useCallback(() => {
    setAssignedTo(null);
  }, []);

  // Check if any values have changed from original
  const hasChanges = useCallback(() => {
    return computedValues.hasAnyChanges;
  }, [computedValues.hasAnyChanges]);

  // Validate the form before submission
  const isFormValid = useCallback(() => {
    return computedValues.isValid;
  }, [computedValues.isValid]);

  const handleSummarize = useCallback(async () => {
    if (!existingCard?.id) return;
    setIsSummarizing(true);
    try {
      const res = await axios.post(
        `/api/context-cards/${existingCard.id}/summarize`,
        {
          projectId: projectSlug,
          cardId: existingCard.id,
        }
      );
      
      setSummaryText(res.data.summary);
      toast.success("Summary generated!");
    } catch (error: unknown) {
      console.error(
        "Error generating summary for card:",
        existingCard.id,
        error
      );
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : "Unknown error";
      toast.error("Failed to generate summary", { 
        description: errorMessage 
      });
      toast.error("Something went wrong");
    } finally {
      setIsSummarizing(false);
    }
  }, [existingCard?.id, projectSlug]);

  const handleSubmit = useCallback(async () => {
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
          attachments?: string[];
          assignedToId?: string | null;
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
        
        // Check if assigned user has changed
        const currentAssignedId = assignedTo?.id || null;
        const originalAssignedId = originalValues?.assignedTo?.id || null;
        if (currentAssignedId !== originalAssignedId) {
          updateData.assignedToId = currentAssignedId;
        }
        
        // Helper function for array comparison
        const arraysEqual = (a: string[], b: string[]) => {
          if (a.length !== b.length) return false;
          const sortedA = [...a].sort();
          const sortedB = [...b].sort();
          return JSON.stringify(sortedA) === JSON.stringify(sortedB);
        };
        
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

        res = await axios.patch(`/api/context-cards/${existingCard.id}`, updateData);
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
        if (assignedTo) formData.append("notifyUserId", assignedTo.id);
        for (const file of attachments) {
          formData.append("attachments", file);
        }
        existingAttachments.forEach((url) => {
          formData.append("existingAttachments", url);
        });

        res = await axios.post("/api/context-cards", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      const responseData = res.data;
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
        setAttachments([]);
        setExistingAttachments([]);
        setStatus("ACTIVE");
      }
    } catch (error: unknown) {
      console.error("Failed to save context card:", error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : "Something went wrong while saving. Please try again.";
      toast.error("Failed to save context card", {
        description: errorMessage,
        duration: 4000,
        position: "top-right",
      });
      console.error("Error saving context card:", error);
    } finally {
      setIsLoading(false);
    }
  }, [title, content, type, visibility, status, why, issues, assignedTo, attachments, existingAttachments, projectSlug, existingCard, originalValues, onSuccess, hasChanges, setOpen]);

  const removeExistingAttachment = useCallback((url: string) => {
    setExistingAttachments(existingAttachments.filter((att) => att !== url));
  }, [existingAttachments]);

  return (
    <Dialog
      open={open}
      onOpenChange={useCallback((val: boolean) => {
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
      }, [existingCard, hasChanges, handleSubmit, setOpen])}
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
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const action = existingCard.isArchived
                      ? "unarchive"
                      : "archive";
                    if (
                      !confirm(`Are you sure you want to ${action} this card?`)
                    )
                      return;
                    try {
                      await axios.patch(
                        `/api/context-cards/${existingCard.id}/archive`,
                        {
                          isArchived: !existingCard.isArchived,
                        }
                      );
                      
                      setOpen(false);
                      onSuccess?.();
                      toast.success(`Card ${action}d`, {
                          description: `The context card has been ${action}d.`,
                          duration: 4000,
                          position: "top-right",
                        });
                    } catch (err: unknown) {
                      console.error(`Error ${action}ing card:`, err);
                      const errorMessage = err instanceof Error && 'response' in err && 
                        typeof err.response === 'object' && err.response !== null &&
                        'data' in err.response && typeof err.response.data === 'object' &&
                        err.response.data !== null && 'error' in err.response.data
                        ? String(err.response.data.error)
                        : `Unable to ${action} the card. Please try again later.`;
                      toast.error(`Failed to ${action} card`, {
                        description: errorMessage,
                        duration: 4000,
                        position: "top-right",
                      });
                    }
                  }}
                  className={`${
                    existingCard.isArchived
                      ? "text-green-600 hover:text-green-800 border-green-300 hover:bg-green-50"
                      : "text-orange-600 hover:text-orange-800 border-orange-300 hover:bg-orange-50"
                  }`}
                >
                  <Archive className="h-4 w-4 mr-1" />
                  {existingCard.isArchived ? "Unarchive" : "Archive"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!confirm("Are you sure you want to delete this card?"))
                      return;
                    try {
                      await axios.delete(
                        `/api/context-cards/${existingCard.id}`
                      );
                      
                      setOpen(false);
                      onSuccess?.();
                      toast.success("Card deleted", {
                        description: "The context card has been removed.",
                        duration: 4000,
                        position: "top-right",
                      });
                    } catch (err: unknown) {
                      console.error("Error deleting card:", err);
                      const errorMessage = err instanceof Error && 'response' in err && 
                        typeof err.response === 'object' && err.response !== null &&
                        'data' in err.response && typeof err.response.data === 'object' &&
                        err.response.data !== null && 'error' in err.response.data
                        ? String(err.response.data.error)
                        : "Unable to remove the card. Please try again later.";
                      toast.error("Failed to delete card", {
                        description: errorMessage,
                        duration: 4000,
                        position: "top-right",
                      });
                    }
                  }}
                  className="text-red-600 hover:text-red-800 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
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

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              GitHub Auto-fill (optional)
            </label>
            <GitHubCardAutoFill
              onAutoFill={(title, content) => {
                setTitle(title);
                setContent(content);
              }}
            />
          </div>
          <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-6 lg:space-y-0">
            <div className="space-y-3 flex-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Type
              </label>
              <div className="flex gap-2 flex-wrap">
                {CARD_TYPES.map((cardType) => (
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
                {VISIBILITY_OPTIONS.map((vis) => (
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
                {STATUS_OPTIONS.map((statusOption) => (
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

          {/* Assignment field */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Assign to team member (optional)
            </label>
            <div className="relative">
              {assignedTo ? (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3">
                  <div className="flex items-center gap-2">
                    {assignedTo.image ? (
                      <Image 
                        src={assignedTo.image} 
                        alt={assignedTo.name || assignedTo.email || 'User'} 
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-white">
                        {getUserAvatarFallback(assignedTo.name, assignedTo.email)}
                      </div>
                    )}
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {assignedTo.name || assignedTo.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAssignmentRemove}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type @ to mention team members..."
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3 text-base text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500"
                    onFocus={() => setShowMemberDropdown(true)}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes('@')) {
                        const query = value.split('@').pop() || '';
                        handleAssignmentSearch(query);
                        setShowMemberDropdown(true);
                      } else {
                        setShowMemberDropdown(false);
                      }
                    }}
                  />
                  
                  {showMemberDropdown && filteredMembers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredMembers.map((member) => (
                        <button
                          key={member.userId}
                          type="button"
                          onClick={() => handleAssignmentSelect(member)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                          {member.image ? (
                            <Image 
                              src={member.image} 
                              alt={member.name || member.email || 'User'} 
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-white">
                              {getUserAvatarFallback(member.name, member.email)}
                            </div>
                          )}
                          <span className="text-sm">
                            {member.name || member.email}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
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
            <ErrorBoundary fallback={
              <div className="pt-6 border-t border-gray-200 dark:border-gray-600 mt-8">
                <p className="text-sm text-muted-foreground text-center py-4">
                  Failed to load comments. Please refresh to try again.
                </p>
              </div>
            }>
              <div className="pt-6 border-t border-gray-200 dark:border-gray-600 mt-8">
                <CommentThread cardId={existingCard.id} />
              </div>
            </ErrorBoundary>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
});

export default ContextCardModal;
