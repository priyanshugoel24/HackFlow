import { User, Project, ContextCard } from "@prisma/client";

export interface UserWithRelations extends User {
  createdProjects?: Project[];
  contextCards?: ContextCard[];
}
