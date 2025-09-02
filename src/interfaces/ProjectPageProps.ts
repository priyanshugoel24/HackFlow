export interface ProjectPageProps {
  params: Promise<{
    teamSlug: string;
    projectSlug: string;
  }>;
}
