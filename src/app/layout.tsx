import type { Metadata } from "next";
import { Providers } from '@/components/providers';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import PresenceManager from "@/components/PresenceManager";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Suspense } from "react";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PresenceErrorFallback } from "@/components/PresenceErrorFallback";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Context Board',
    default: 'Context Board - Your Personal Context Management Dashboard',
  },
  description: "Your personal context management dashboard for organizing projects, teams, and tasks in one collaborative workspace.",
  keywords: ['project management', 'team collaboration', 'task tracking', 'context board', 'productivity'],
  authors: [{ name: 'Context Board Team' }],
  creator: 'Context Board',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Context Board',
    title: 'Context Board - Your Personal Context Management Dashboard',
    description: 'Your personal context management dashboard for organizing projects, teams, and tasks in one collaborative workspace.',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@contextboard',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification if needed
    // google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Providers>
            <Suspense fallback={<PageLoadingSpinner text="Loading application..." />}>
              <ErrorBoundary
                fallback={<PresenceErrorFallback />}
              >
                <PresenceManager />
              </ErrorBoundary>
              {children}
              <Suspense fallback={null}>
                <Toaster richColors position="top-right" />
              </Suspense>
            </Suspense>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
