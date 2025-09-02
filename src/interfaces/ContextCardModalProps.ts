import { ExistingCard } from './ExistingCard';
import { Project } from './Project';

export interface ContextCardModalProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  projectSlug: string;
  project?: Project;
  existingCard?: ExistingCard & { createdById?: string };
  onSuccess?: () => void;
  teamSlug?: string;
}
