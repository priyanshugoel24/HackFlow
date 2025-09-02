export interface AnalyticsPageProps {
  params: Promise<{
    teamSlug: string;
    projectSlug: string;
  }>;
}
