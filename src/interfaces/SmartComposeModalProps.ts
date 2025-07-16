export interface SmartComposeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  projectSlug: string;
  onSuccess?: () => void;
}
