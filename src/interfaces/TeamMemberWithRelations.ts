import { User, Team, TeamMember } from "@prisma/client";

export interface TeamMemberWithRelations extends TeamMember {
  user: User;
  team: Team;
  addedBy?: User;
}
