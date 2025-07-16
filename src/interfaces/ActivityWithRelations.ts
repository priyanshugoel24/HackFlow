import { User, Project, Activity } from "@prisma/client";

export interface ActivityWithRelations extends Activity {
  user?: User;
  project: Project;
}
