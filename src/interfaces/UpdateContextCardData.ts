import { CreateContextCardData } from './CreateContextCardData';

export interface UpdateContextCardData extends Partial<CreateContextCardData> {
  isPinned?: boolean;
  isArchived?: boolean;
  status?: 'ACTIVE' | 'CLOSED';
  linkedCardId?: string;
}
