import { TeamPageProject } from './TeamPageProject';
import { TeamPageMember } from './TeamPageMember';

export interface TeamPageTeam {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hackathonDeadline?: string;
  hackathonModeEnabled: boolean;
  projects: TeamPageProject[];
  members: TeamPageMember[];
  userRole?: string;
  _count: {
    members: number;
    projects: number;
  };
}
