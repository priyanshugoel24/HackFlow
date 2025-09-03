import { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginPage from '@/components/LoginPage';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Sign In | HackFlow - Collaborative Workspace Platform',
    description: 'Sign in to HackFlow to access your collaborative workspace. Manage projects, track tasks, and collaborate with your team in real-time. Join thousands of teams building together.',
    keywords: [
      'login',
      'sign in',
      'authentication',
      'HackFlow',
      'collaborative workspace',
      'project management',
      'team collaboration',
      'real-time editing',
      'task tracking',
      'AI-powered summaries',
      'OAuth',
      'GitHub',
      'Google'
    ],
    authors: [{ name: 'HackFlow Team' }],
    creator: 'HackFlow',
    publisher: 'HackFlow',
    applicationName: 'HackFlow',
    referrer: 'origin-when-cross-origin',
    openGraph: {
      title: 'Sign In to HackFlow - Your Collaborative Workspace',
      description: 'Access your collaborative workspace to manage projects, track tasks, and collaborate with your team in real-time. Modern workspace for teams that build together.',
      type: 'website',
      locale: 'en_US',
      url: '/login',
      siteName: 'HackFlow',
      images: [
        {
          url: '/og-login.jpg',
          width: 1200,
          height: 630,
          alt: 'HackFlow Login - Collaborative Workspace Platform',
          type: 'image/jpeg',
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Sign In to HackFlow - Collaborative Workspace',
      description: 'Access your workspace to manage projects and collaborate with your team in real-time.',
      images: ['/og-login.jpg'],
      creator: '@hackflow',
      site: '@hackflow',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: '/login',
    },
    category: 'productivity',
  };
}

export default async function LoginPageRoute() {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);
  
  // Redirect authenticated users to dashboard
  if (session) {
    redirect('/');
  }

  return <LoginPage />;
}
