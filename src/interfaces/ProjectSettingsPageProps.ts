export interface ProjectSettingsPageProps {
  params: Promise<{
    teamSlug: string;
    projectSlug: string;
  }>;
}
