'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/ui/BackButton';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
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
  ArrowLeft
} from 'lucide-react';
import { TeamAnalytics } from '@/interfaces/TeamAnalytics';
import { analyticsConfig } from '@/config/analytics';

export default function TeamAnalyticsPage() {
  const { teamSlug } = useParams();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<TeamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [teamSlug]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`/api/teams/${teamSlug}/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching team analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.weeklyVelocity}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(label) => `Week of ${label}`}
                    formatter={(value) => [`${value} tasks`, 'Completed']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.cardTypeDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ type, percentage }) => `${type}: ${percentage}%`}
                        >
                          {analytics.cardTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={analyticsConfig.chartColors[index % analyticsConfig.chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px'
                          }}
                          formatter={(value, name) => [`${value} cards`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
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
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={analytics.topContributors.slice(0, 6)} 
                      layout="horizontal"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        type="number"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        type="category"
                        dataKey="userName"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                        width={100}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                        formatter={(value, name) => [
                          value,
                          name === 'cardsCreated' ? 'Cards Created' : 'Cards Completed'
                        ]}
                      />
                      <Legend />
                      <Bar 
                        dataKey="cardsCreated" 
                        fill="#3b82f6" 
                        name="Created"
                        radius={[0, 2, 2, 0]}
                      />
                      <Bar 
                        dataKey="cardsCompleted" 
                        fill="#10b981" 
                        name="Completed"
                        radius={[0, 2, 2, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
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
