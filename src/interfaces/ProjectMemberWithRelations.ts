import { User, Project, ProjectMember } from "@prisma/client";

export interface ProjectMemberWithRelations extends ProjectMember {
  user: User;
  project: Project;
  addedBy?: User;
}
