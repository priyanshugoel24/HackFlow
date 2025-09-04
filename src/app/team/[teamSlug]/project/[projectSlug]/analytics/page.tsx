import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import dynamic from 'next/dynamic';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/ui/BackButton';
import { Suspense } from 'react';
import { ComponentLoadingSpinner } from '@/components/LoadingSpinner';

// Lazy load chart components
const WeeklyVelocityChart = dynamic(() => import('@/components/charts/WeeklyVelocityChart'), {
  loading: () => <ComponentLoadingSpinner text="Loading velocity chart..." />
});

const CardTypeDistributionChart = dynamic(() => import('@/components/charts/CardTypeDistributionChart'), {
  loading: () => <ComponentLoadingSpinner text="Loading distribution chart..." />
});

const TopContributorsChart = dynamic(() => import('@/components/charts/TopContributorsChart'), {
  loading: () => <ComponentLoadingSpinner text="Loading contributors chart..." />
});
import { 
  Target, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Activity,
  Calendar,
  Award,
  Timer,
} from 'lucide-react';
import { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { AnalyticsPageProps } from '@/interfaces/AnalyticsPageProps';
import { analyticsConfig } from '@/config/analytics';
import { getAuthenticatedUserFromSession } from '@/lib/auth-utils';

// Server-side data fetching for project analytics
async function fetchProjectAnalytics(teamSlug: string, projectSlug: string) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    // Get authenticated user
    const user = await getAuthenticatedUserFromSession(session);
    if (!user) {
      return null;
    }

    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      include: {
        team: {
          include: {
            members: {
              where: { status: 'ACTIVE' },
            },
          },
        },
        contextCards: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!project || !project.team || project.team.slug !== teamSlug) {
      return null;
    }

    // Check if user is a member of this team
    const userMembership = project.team.members.find(
      (member) => member.userId === user.id
    );

    if (!userMembership) {
      return null;
    }

    // Calculate comprehensive analytics
    const cards = project.contextCards;
    const totalCards = cards.length;
    const totalTasks = cards.filter(c => c.type === 'TASK').length;
    const completedTasks = cards.filter(c => c.type === 'TASK' && c.status === 'CLOSED').length;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Card type distribution
    const cardTypeDistribution = {
      TASK: cards.filter(c => c.type === 'TASK').length,
      INSIGHT: cards.filter(c => c.type === 'INSIGHT').length,
      DECISION: cards.filter(c => c.type === 'DECISION').length,
    };

    // Task status overview
    const taskStatusOverview = {
      ACTIVE: cards.filter(c => c.type === 'TASK' && c.status === 'ACTIVE').length,
      CLOSED: cards.filter(c => c.type === 'TASK' && c.status === 'CLOSED').length,
    };

    // Visibility distribution
    const visibilityDistribution = {
      PRIVATE: cards.filter(c => c.visibility === 'PRIVATE').length,
      PUBLIC: cards.filter(c => c.visibility === 'PUBLIC').length,
    };

    // Top contributors
    const contributors = cards.reduce((acc, card) => {
      const userId = card.user.id;
      const userName = card.user.name || card.user.email || 'Unknown';
      if (!acc[userId]) {
        acc[userId] = { userId, userName, cardsCreated: 0, cardsCompleted: 0 };
      }
      acc[userId].cardsCreated += 1;
      if (card.status === 'CLOSED') {
        acc[userId].cardsCompleted += 1;
      }
      return acc;
    }, {} as Record<string, { userId: string; userName: string; cardsCreated: number; cardsCompleted: number; }>);

    const topContributors = Object.values(contributors)
      .sort((a, b) => b.cardsCreated - a.cardsCreated)
      .slice(0, 5);

    // Weekly velocity (simplified)
    const weeklyVelocity = Array.from({ length: 8 }, (_, i) => ({
      week: `Week ${i + 1}`,
      completed: Math.floor(Math.random() * 5), // Placeholder data
      created: Math.floor(Math.random() * 8),
    }));

    return {
      totalCards,
      totalTasks,
      completedTasks,
      taskCompletionRate,
      cardTypeDistribution,
      taskStatusOverview,
      visibilityDistribution,
      topContributors,
      weeklyVelocity,
    };
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    return null;
  }
}

// Server-side data fetching for project details
async function fetchProject(teamSlug: string, projectSlug: string) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    if (!session?.user?.email) {
      return null;
    }

    // First, ensure the user exists in the database and get the actual user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {
        name: session.user.name,
        image: session.user.image,
      },
      create: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    });

    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
      include: {
        team: {
          include: {
            members: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!project || !project.team || project.team.slug !== teamSlug) {
      return null;
    }

    // Check if user is a member of this team
    const userMembership = project.team.members.find(
      (member) => member.userId === user.id
    );

    if (!userMembership) {
      return null;
    }

    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      lastActivityAt: project.lastActivityAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching project:', error);
    return null;
  }
}

export default async function ProjectAnalyticsPage({ params }: AnalyticsPageProps) {
  const session = await getServerSession(authOptions) as Session | null;
  
  if (!session) {
    redirect('/');
  }

  const { teamSlug, projectSlug } = await params;
  
  // Fetch project and analytics data
  const [project, analytics] = await Promise.all([
    fetchProject(teamSlug, projectSlug),
    fetchProjectAnalytics(teamSlug, projectSlug)
  ]);

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Project not found</h1>
            <p className="text-muted-foreground">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Analytics not available</h1>
            <p className="text-muted-foreground">Unable to load project analytics data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton label="Back to Project" className="mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Project Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights for {project.name}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Data refreshed in real-time</span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCards}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.totalTasks} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.taskCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.completedTasks} of {analytics.totalTasks} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contributors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.topContributors.length}</div>
              <p className="text-xs text-muted-foreground">active contributors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.taskStatusOverview.ACTIVE}</div>
              <p className="text-xs text-muted-foreground">remaining</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Velocity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ComponentLoadingSpinner text="Loading velocity data..." />}>
                <WeeklyVelocityChart data={analytics.weeklyVelocity} />
              </Suspense>
            </CardContent>
          </Card>

          {/* Card Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Card Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(analytics.cardTypeDistribution).length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center">
                  <div className="w-full lg:w-1/2 h-64">
                    <Suspense fallback={<ComponentLoadingSpinner text="Loading card distribution..." />}>
                      <CardTypeDistributionChart data={Object.entries(analytics.cardTypeDistribution).map(([type, count]) => ({
                        type,
                        count,
                        percentage: analytics.totalCards > 0 ? Math.round((count / analytics.totalCards) * 100) : 0,
                      }))} />
                    </Suspense>
                  </div>
                  <div className="w-full lg:w-1/2 space-y-3">
                    {Object.entries(analytics.cardTypeDistribution).map(([type, count], index) => (
                      <div key={type} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: analyticsConfig.chartColors[index % analyticsConfig.chartColors.length] }}
                          />
                          <span className="text-sm font-medium">{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{count}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {analytics.totalCards > 0 ? Math.round((count / analytics.totalCards) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No cards created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topContributors.length > 0 ? (
              <div className="h-64">
                <Suspense fallback={<ComponentLoadingSpinner text="Loading contributors data..." />}>
                  <TopContributorsChart data={analytics.topContributors} />
                </Suspense>
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No contributions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
