import { User, Project, ContextCard, Team } from "@prisma/client";

export interface ProjectWithRelations extends Project {
  createdBy: User;
  contextCards?: ContextCard[];
  team?: Team;
}
