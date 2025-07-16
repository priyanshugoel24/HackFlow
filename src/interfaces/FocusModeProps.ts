import { ContextCardWithRelations } from './ContextCardWithRelations';

export interface FocusModeProps {
  cards: ContextCardWithRelations[];
  open: boolean;
  onClose: () => void;
  workDuration?: number; // in minutes, default 25
  breakDuration?: number; // in minutes, default 5
}
