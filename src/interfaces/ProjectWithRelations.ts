import { User, Project, ProjectMember, ContextCard, Team } from "@prisma/client";

export interface ProjectWithRelations extends Project {
  createdBy: User;
  members: ProjectMember[];
  contextCards?: ContextCard[];
  team?: Team;
}
