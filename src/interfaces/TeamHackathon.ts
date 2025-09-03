import { TeamMemberWithRelations } from './TeamMemberWithRelations';
import { Project } from './Project';

export interface TeamHackathon {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hackathonModeEnabled: boolean;
  hackathonDeadline?: string;
  hackathonEndedAt?: string;
  userRole?: string;
  members: TeamMemberWithRelations[];
  projects: Project[];
}
