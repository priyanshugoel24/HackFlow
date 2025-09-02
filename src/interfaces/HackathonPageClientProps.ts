import { TeamHackathon } from './TeamHackathon';
import { ContextCardWithRelations } from './ContextCardWithRelations';
import { HackathonUpdate } from './HackathonUpdate';

export interface HackathonPageClientProps {
  initialTeam: TeamHackathon | null;
  initialCards: ContextCardWithRelations[];
  initialUpdates: HackathonUpdate[];
}
