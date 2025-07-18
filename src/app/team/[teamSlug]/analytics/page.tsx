import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import dynamic from 'next/dynamic';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/ui/BackButton';

// Lazy load chart components
const AnalyticsCharts = dynamic(() => import('@/components/AnalyticsCharts'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" />
});

const WeeklyVelocityChart = dynamic(() => import('@/components/charts/WeeklyVelocityChart'), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded" />
});

const CardTypeDistributionChart = dynamic(() => import('@/components/charts/CardTypeDistributionChart'), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded" />
});

const TopContributorsChart = dynamic(() => import('@/components/charts/TopContributorsChart'), {
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded" />
});
import { 
  Target, 
  CheckCircle, 
  Users, 
  Clock,
  BarChart3,
  TrendingUp,
  Activity,
  Calendar,
  Award,
  Timer,
} from 'lucide-react';
import { TeamAnalytics } from '@/interfaces/TeamAnalytics';
import { analyticsConfig } from '@/config/analytics';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';

interface TeamAnalyticsPageProps {
  params: Promise<{ teamSlug: string }>;
}

// Server-side data fetching
async function fetchTeamAnalytics(teamSlug: string): Promise<TeamAnalytics | null> {
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

    const team = await prisma.team.findUnique({
      where: { slug: teamSlug },
      include: {
        members: {
          include: {
            user: true,
          },
          where: { status: 'ACTIVE' },
        },
        projects: {
          include: {
            contextCards: {
              include: {
                user: true,
              },
            },
          },
          where: { isArchived: false },
        },
      },
    });

    if (!team) {
      return null;
    }

    // Check if user is a member of this team
    const userMembership = team.members.find(
      (member) => member.user.id === user.id
    );

    if (!userMembership) {
      return null;
    }

    // Calculate analytics
    const totalProjects = team.projects.length;
    const completedProjects = team.projects.filter(p => 
      p.contextCards.length > 0 && p.contextCards.every(c => c.status === 'CLOSED')
    ).length;
    const activeProjects = totalProjects - completedProjects;

    const allCards = team.projects.flatMap(p => p.contextCards);
    const totalCards = allCards.length;
    const totalTasks = allCards.filter(c => c.type === 'TASK').length;
    const completedTasks = allCards.filter(c => c.type === 'TASK' && c.status === 'CLOSED').length;
    const activeTasks = totalTasks - completedTasks;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const activeMembers = team.members.length;

    // Calculate average time to complete (simplified)
    const avgTimeToComplete = 2.5; // Placeholder number

    // Project progress
    const projectProgress = team.projects.map(project => {
      const projectTasks = project.contextCards.filter(c => c.type === 'TASK');
      const projectCompletedTasks = projectTasks.filter(c => c.status === 'CLOSED').length;
      const progress = projectTasks.length > 0 ? Math.round((projectCompletedTasks / projectTasks.length) * 100) : 0;
      
      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        progress,
        completedTasks: projectCompletedTasks,
        totalTasks: projectTasks.length,
      };
    });

    // Weekly velocity (simplified - returning empty for now)
    const weeklyVelocity = Array.from({ length: 8 }, (_, i) => ({
      week: `Week ${i + 1}`,
      completed: 0,
      created: 0,
    }));

    // Card type distribution
    const cardTypes = allCards.reduce((acc, card) => {
      acc[card.type] = (acc[card.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cardTypeDistribution = Object.entries(cardTypes).map(([type, count]) => ({
      type,
      count,
      percentage: totalCards > 0 ? Math.round((count / totalCards) * 100) : 0,
    }));

    // Top contributors
    const contributors = allCards.reduce((acc, card) => {
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

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      totalCards,
      totalTasks,
      completedTasks,
      activeTasks,
      taskCompletionRate,
      activeMembers,
      avgTimeToComplete,
      projectProgress,
      weeklyVelocity,
      cardTypeDistribution,
      topContributors,
    } as TeamAnalytics;
  } catch (error) {
    console.error('Error fetching team analytics:', error);
    return null;
  }
}

export default async function TeamAnalyticsPage({ 
  params 
}: TeamAnalyticsPageProps) {
  const { teamSlug } = await params;
  
  // Fetch data server-side
  const analytics = await fetchTeamAnalytics(teamSlug);

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Analytics not available</h1>
            <p className="text-muted-foreground">Unable to load team analytics data.</p>
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
          <BackButton label="Back to Team" className="mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Team Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into team performance and project progress
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
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.completedProjects} completed, {analytics.activeProjects} active
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
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeMembers}</div>
              <p className="text-xs text-muted-foreground">active members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgTimeToComplete}</div>
              <p className="text-xs text-muted-foreground">days per task</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Charts */}
        <AnalyticsCharts analytics={analytics} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Project Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.projectProgress.map((project) => (
                  <div key={project.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate flex-1 mr-2">
                        {project.name}
                      </span>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {project.completedTasks}/{project.totalTasks}
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{project.progress}% complete</span>
                      <span>{project.totalTasks} tasks</span>
                    </div>
                  </div>
                ))}
                {analytics.projectProgress.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No projects with tasks</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Velocity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Velocity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyVelocityChart data={analytics.weeklyVelocity} />
              {analytics.weeklyVelocity.every(week => week.completed === 0) && (
                <div className="text-center text-muted-foreground mt-4">
                  <p className="text-sm">No tasks completed in the last 8 weeks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Card Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.cardTypeDistribution.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center">
                  <div className="w-full lg:w-1/2 h-64">
                    <CardTypeDistributionChart data={analytics.cardTypeDistribution} />
                  </div>
                  <div className="w-full lg:w-1/2 space-y-3">
                    {analytics.cardTypeDistribution.map((item, index) => (
                      <div key={item.type} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: analyticsConfig.chartColors[index % analyticsConfig.chartColors.length] }}
                          />
                          <span className="text-sm font-medium">{item.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.count}</Badge>
                          <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No cards created yet</p>
                  <p className="text-sm text-muted-foreground">Start creating tasks, insights, and decisions to see distribution</p>
                </div>
              )}
            </CardContent>
          </Card>

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
                  <TopContributorsChart data={analytics.topContributors} />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No contributions yet</p>
                  <p className="text-sm text-muted-foreground">Team members will appear here as they create and complete cards</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cards</p>
                  <p className="text-2xl font-bold">{analytics.totalCards}</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                  <p className="text-2xl font-bold">{analytics.activeTasks}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{analytics.taskCompletionRate}%</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
