import { User, Team } from "@prisma/client";
import { TeamMemberWithRelations } from "./TeamMemberWithRelations";
import { ProjectWithRelations } from "./ProjectWithRelations";

export interface TeamWithRelations extends Team {
  createdBy: User;
  members: TeamMemberWithRelations[];
  projects: ProjectWithRelations[];
  _count?: {
    members: number;
    projects: number;
  };
  role?: string; // User's role in this team
  joinedAt?: Date;
}
