export interface AIMetadata {
  relevantProjects?: Array<{
    id: string;
    name: string;
    reason?: string;
    score?: number;
  }>;
  relevantTeams?: Array<{
    id: string;
    name: string;
    reason?: string;
    score?: number;
  }>;
  reason?: string;
  confidence?: number;
}
