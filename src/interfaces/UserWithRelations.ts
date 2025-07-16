import { User, Project, ProjectMember, ContextCard } from "@prisma/client";

export interface UserWithRelations extends User {
  createdProjects?: Project[];
  memberships?: ProjectMember[];
  contextCards?: ContextCard[];
}
