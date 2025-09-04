// Structured data helpers for SEO
export interface OrganizationStructuredData {
  "@context": "https://schema.org";
  "@type": "Organization" | "SoftwareApplication" | "WebApplication";
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
}

export interface WebPageStructuredData {
  "@context": "https://schema.org";
  "@type": "WebPage";
  name: string;
  description?: string;
  url?: string;
  isPartOf?: {
    "@type": "WebSite";
    name: string;
    url: string;
  };
  breadcrumb?: {
    "@type": "BreadcrumbList";
    itemListElement: Array<{
      "@type": "ListItem";
      position: number;
      name: string;
      item?: string;
    }>;
  };
}

export function generateOrganizationStructuredData(): OrganizationStructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Context Board",
    description: "Your personal context management dashboard for organizing projects, teams, and tasks in one collaborative workspace.",
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
  };
}

export function generateWebPageStructuredData({
  name,
  description,
  url,
  breadcrumbs = [],
}: {
  name: string;
  description?: string;
  url?: string;
  breadcrumbs?: Array<{ name: string; url?: string }>;
}): WebPageStructuredData {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: url ? `${baseUrl}${url}` : baseUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Context Board",
      url: baseUrl,
    },
    ...(breadcrumbs.length > 0 && {
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          ...(crumb.url && { item: `${baseUrl}${crumb.url}` }),
        })),
      },
    }),
  };
}

export function generateStructuredDataScript(data: OrganizationStructuredData | WebPageStructuredData | Array<OrganizationStructuredData | WebPageStructuredData>): string {
  return JSON.stringify(Array.isArray(data) ? data : [data]);
}
