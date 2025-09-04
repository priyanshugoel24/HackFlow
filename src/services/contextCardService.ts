import axios from "axios";
import { toast } from "sonner";
import { TOAST_DURATION, TOAST_POSITION } from "@/config/contextCard";
import { extractErrorMessage } from "@/utils/contextCard";

export interface TeamMember {
  userId: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface CreateContextCardData {
  title: string;
  content: string;
  projectId: string;
  type: string;
  visibility: string;
  status: string;
  why?: string;
  issues?: string;
  attachments?: File[];
  existingAttachments?: string[];
  notifyUserId?: string;
}

export interface UpdateContextCardData {
  title?: string;
  content?: string;
  type?: string;
  visibility?: string;
  status?: string;
  why?: string;
  issues?: string;
  attachments?: string[];
  assignedToId?: string | null;
  notifyUserId?: string;
}

/**
 * Upload file to Supabase via API route
 */
export const uploadFileToSupabase = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", file);
  
  try {
    const res = await axios.post("/api/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return res.data;
  } catch (error: unknown) {
    console.error("Upload API error:", error);
    const errorMessage = extractErrorMessage(error, "Unknown error");
    toast.error(`Upload failed: ${errorMessage}`, {
      description: `Failed to upload ${file.name}`,
      duration: TOAST_DURATION,
      position: TOAST_POSITION,
    });
    return null;
  }
};

/**
 * Fetch team members for a project
 */
export const fetchTeamMembers = async (projectSlug: string): Promise<TeamMember[]> => {
  const response = await axios.get(`/api/projects/${projectSlug}/team-members`);
  return response.data.map((member: {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
    };
  }) => ({
    userId: member.user.id,
    name: member.user.name,
    email: member.user.email,
    image: member.user.image,
  }));
};

/**
 * Create a new context card
 */
export const createContextCard = async (data: CreateContextCardData) => {
  const formData = new FormData();
  formData.append("title", data.title);
  formData.append("content", data.content);
  formData.append("projectId", data.projectId);
  formData.append("type", data.type);
  formData.append("visibility", data.visibility);
  formData.append("status", data.status);
  
  if (data.why) formData.append("why", data.why);
  if (data.issues) formData.append("issues", data.issues);
  if (data.notifyUserId) formData.append("notifyUserId", data.notifyUserId);
  
  if (data.attachments) {
    for (const file of data.attachments) {
      formData.append("attachments", file);
    }
  }
  
  if (data.existingAttachments) {
    data.existingAttachments.forEach((url) => {
      formData.append("existingAttachments", url);
    });
  }

  return await axios.post("/api/context-cards", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Update an existing context card
 */
export const updateContextCard = async (cardId: string, data: UpdateContextCardData) => {
  return await axios.patch(`/api/context-cards/${cardId}`, data);
};

/**
 * Delete a context card
 */
export const deleteContextCard = async (cardId: string) => {
  return await axios.delete(`/api/context-cards/${cardId}`);
};

/**
 * Archive/unarchive a context card
 */
export const archiveContextCard = async (cardId: string, isArchived: boolean) => {
  return await axios.patch(`/api/context-cards/${cardId}/archive`, {
    isArchived,
  });
};

/**
 * Generate summary for a context card
 */
export const summarizeCard = async (cardId: string, projectId: string) => {
  return await axios.post(`/api/context-cards/${cardId}/summarize`, {
    projectId,
    cardId,
  });
};
