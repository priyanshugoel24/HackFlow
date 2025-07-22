export interface FuseSearchResult<T> {
  item: T;
  score?: number;
}

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

export interface ProjectSearchData {
  id: string;
  name: string;
  slug: string;
  teamName?: string;
}

export interface TeamSearchData {
  id: string;
  name: string;
  slug: string;
}
