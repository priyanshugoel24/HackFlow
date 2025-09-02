import { ContextCardWithRelations } from './ContextCardWithRelations';
import { ProjectWithRelations } from './ProjectWithRelations';

export interface ContextCardListProps {
  projectSlug: string;
  initialCards?: ContextCardWithRelations[];
  project?: ProjectWithRelations;
  teamSlug?: string;
}
