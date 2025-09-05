// Modal component prop interfaces

export interface SmartComposeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  projectSlug: string;
  onSuccess?: () => void;
}

export interface InviteMemberModalProps {
  teamSlug: string;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  onInviteSent?: () => void;
  triggerButton?: boolean; // Whether to show the trigger button
}

export interface ProjectModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess?: () => void;
  teamId?: string;
}

export interface CreateTeamModalProps {
  onTeamCreated?: () => void;
}
