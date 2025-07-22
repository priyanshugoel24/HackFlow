export interface AIProject {
  id: string;
  name: string;
  slug: string;
  reason?: string;
  score?: number;
}

export interface AITeam {
  id: string;
  name: string;
  slug: string;
  reason?: string;
  score?: number;
}

export interface AIMetadata {
  sources?: Array<{
    id: string;
    title: string;
    type: string;
    url?: string;
  }>;
  confidence?: number;
  projectsUsed?: string[];
  teamsUsed?: string[];
  scope?: string;
  teamsAnalyzed?: number;
  projectsAnalyzed?: number;
  cardsAnalyzed?: number;
  relevantProjects?: AIProject[];
  relevantTeams?: AITeam[];
  [key: string]: unknown;
}
