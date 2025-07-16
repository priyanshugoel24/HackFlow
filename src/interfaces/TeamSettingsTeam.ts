import { TeamSettingsMember } from './TeamSettingsMember';

export interface TeamSettingsTeam {
  id: string;
  name: string;
  slug: string;
  description?: string;
  members: TeamSettingsMember[];
  userRole: string;
  currentUserId: string;
}
