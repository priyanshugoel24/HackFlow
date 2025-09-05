'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Form state management types
export interface FormState {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

// Server Action for context card forms with redirect
export async function createContextCardAction(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { createContextCard } = await import('./card-actions');
    const result = await createContextCard(formData);
    
    if (result.success) {
      return { 
        success: true, 
        message: 'Context card created successfully!' 
      };
    }
    
    return { 
      success: false, 
      message: 'Failed to create context card' 
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

// Server Action for updating context card with redirect
export async function updateContextCardAction(
  cardId: string,
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { updateContextCard } = await import('./card-actions');
    const result = await updateContextCard(cardId, formData);
    
    if (result.success) {
      return { 
        success: true, 
        message: 'Context card updated successfully!' 
      };
    }
    
    return { 
      success: false, 
      message: 'Failed to update context card' 
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

// Server Action for creating teams with redirect
export async function createTeamAction(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { createTeam } = await import('./team-actions');
    const result = await createTeam(formData);
    
    if (result.success && result.team) {
      revalidatePath('/dashboard');
      redirect(`/team/${result.team.slug}`);
    }
    
    return { 
      success: false, 
      message: 'Failed to create team' 
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

// Server Action for creating projects with redirect
export async function createProjectAction(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { createProject } = await import('./team-actions');
    const result = await createProject(formData);
    
    if (result.success && result.project) {
      if (result.project.team) {
        revalidatePath(`/team/${result.project.team.slug}`);
        redirect(`/team/${result.project.team.slug}/project/${result.project.slug}`);
      } else {
        revalidatePath('/dashboard');
        redirect(`/project/${result.project.slug}`);
      }
    }
    
    return { 
      success: false, 
      message: 'Failed to create project' 
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

// Server Action for AI card creation
export async function createCardWithAIAction(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { createCardWithAI } = await import('./card-actions');
    const input = formData.get('input') as string;
    const projectId = formData.get('projectId') as string;
    
    const result = await createCardWithAI(input, projectId);
    
    if (result.success) {
      const message = 'fallbackUsed' in result && result.fallbackUsed
        ? 'Card created successfully! (Note: AI service is not configured, basic parsing was used)'
        : 'AI card created successfully!';
      
      return { 
        success: true, 
        message
      };
    }
    
    return { 
      success: false, 
      message: 'Failed to create AI card' 
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

// Server Action for adding comments
export async function addCommentAction(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { addComment } = await import('./card-actions');
    const cardId = formData.get('cardId') as string;
    const content = formData.get('content') as string;
    const parentId = formData.get('parentId') as string | undefined;
    
    const result = await addComment(cardId, content, parentId);
    
    if (result.success) {
      return { 
        success: true, 
        message: 'Comment added successfully!' 
      };
    }
    
    return { 
      success: false, 
      message: 'Failed to add comment' 
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

// Server Action for sending invitations
export async function sendInvitationAction(
  previousState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const { sendTeamInvitation } = await import('./team-actions');
    const result = await sendTeamInvitation(formData);
    
    if (result.success) {
      return { 
        success: true, 
        message: 'Invitation sent successfully!' 
      };
    }
    
    return { 
      success: false, 
      message: 'Failed to send invitation' 
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}
