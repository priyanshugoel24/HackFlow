import { Activity } from './Activity';

export interface ActivityFeedProps {
  projectId?: string;
  slug?: string;
  teamSlug?: string;
  initialActivities?: Activity[];
}
