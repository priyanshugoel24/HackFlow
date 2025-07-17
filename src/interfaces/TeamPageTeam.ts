import { TeamPageProject } from './TeamPageProject';
import { TeamPageMember } from './TeamPageMember';
import { Activity } from './Activity';

export interface TeamPageTeam {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hackathonDeadline?: string;
  hackathonModeEnabled: boolean;
  projects: TeamPageProject[];
  members: TeamPageMember[];
  activities?: Activity[];
  userRole?: string;
  currentUserId?: string;
  _count: {
    members: number;
    projects: number;
  };
}
