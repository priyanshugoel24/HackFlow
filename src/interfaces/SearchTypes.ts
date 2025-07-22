// Interface for project data used in fuzzy search
export interface ProjectSearchData {
  id: string;
  name: string;
  slug: string;
  teamName?: string;
}

// Interface for team data used in fuzzy search
export interface TeamSearchData {
  id: string;
  name: string;
  slug: string;
}

// Interface for Fuse.js search results
export interface FuseSearchResult<T> {
  item: T;
  score?: number;
  refIndex: number;
}

// Interfaces for relevant project and team matches
export interface RelevantProject {
  project: ProjectSearchData;
  score: number;
  reason: string;
}

export interface RelevantTeam {
  team: TeamSearchData;
  score: number;
  reason: string;
}
