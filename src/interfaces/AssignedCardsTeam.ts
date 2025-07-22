import { TeamMemberWithRelations } from "./TeamMemberWithRelations";

export interface AssignedCardsTeam {
  id: string;
  name: string;
  slug: string;
  members: TeamMemberWithRelations[];
}
