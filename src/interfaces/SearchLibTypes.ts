// Search-related type definitions

export type CardResult = {
  id: string;
  title: string;
  projectId: string;
  project?: {
    slug: string;
    name: string;
    team?: {
      slug: string;
      name: string;
    };
  };
};

export type ProjectResult = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  tags: string[];
  team?: {
    slug: string;
    name: string;
  } | null;
};

export type TeamResult = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count: {
    projects: number;
  };
};

export type GlobalSearchResult = {
  type: 'card' | 'project' | 'team';
} & (CardResult | ProjectResult | TeamResult);
