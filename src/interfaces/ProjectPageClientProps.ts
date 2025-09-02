import { ProjectPageProject } from './ProjectPageProject';
import { ProjectPageTeam } from './ProjectPageTeam';

export interface ProjectPageClientProps {
  project: ProjectPageProject;
  team: ProjectPageTeam;
  teamSlug: string;
  projectSlug: string;
}
