import { HackathonTeamMember } from './HackathonTeamMember';
import { HackathonProject } from './HackathonProject';

export interface HackathonTeam {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hackathonModeEnabled: boolean;
  hackathonDeadline?: string;
  userRole?: string;
  members: HackathonTeamMember[];
  projects: HackathonProject[];
}
