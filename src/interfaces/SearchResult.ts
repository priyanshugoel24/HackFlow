export type SearchResult = {
  type: "card" | "project" | "member" | "tag" | "team";
  id: string;
  originalId?: string;
  title?: string;
  name?: string;
  email?: string;
  tag?: string;
  projectId?: string;
  projectSlug?: string;
  slug?: string;
  projectName?: string;
  teamName?: string;
  teamSlug?: string;
  description?: string;
  projectCount?: number;
};
