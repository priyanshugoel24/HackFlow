"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, BarChart3, PieChart as PieChartIcon, Activity, Target, Eye, Archive } from "lucide-react";
import LoginPage from "@/components/LoginPage";
import Navbar from "@/components/Navbar";

interface AnalyticsData {
  cardTypeDistribution: {
    TASK: number;
    INSIGHT: number;
    DECISION: number;
  };
  taskStatusOverview: {
    ACTIVE: number;
    CLOSED: number;
  };
  visibilityDistribution: {
    PRIVATE: number;
    PUBLIC: number;
  };
  cardCreationOverTime: Array<{
    date: string;
    count: number;
    formattedDate: string;
  }>;
  totalCards: number;
  archivedCards: number;
  activeCards: number;
  topContributors: Array<{
    name: string;
    email: string;
    count: number;
  }>;
  project: {
    id: string;
    name: string;
    slug: string;
  };
}

const COLORS = {
  TASK: '#3B82F6',
  INSIGHT: '#F59E0B',
  DECISION: '#10B981',
  ACTIVE: '#22C55E',
  CLOSED: '#6B7280',
  PRIVATE: '#EF4444',
  PUBLIC: '#8B5CF6',
};

export default function ProjectAnalyticsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const projectSlug = params?.slug as string;
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectSlug) return;

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/projects/${projectSlug}/analytics`);
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const data = await response.json();
        setAnalytics(data.analytics);
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [projectSlug]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">{error || "Failed to load analytics"}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for charts
  const cardTypeData = Object.entries(analytics.cardTypeDistribution).map(([key, value]) => ({
    name: key,
    value,
    color: COLORS[key as keyof typeof COLORS],
  }));

  const taskStatusData = Object.entries(analytics.taskStatusOverview).map(([key, value]) => ({
    name: key,
    value,
    color: COLORS[key as keyof typeof COLORS],
  }));

  const visibilityData = Object.entries(analytics.visibilityDistribution).map(([key, value]) => ({
    name: key,
    value,
    color: COLORS[key as keyof typeof COLORS],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{`${label}: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Project</span>
            </Button>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Analytics Dashboard
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {analytics.project.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Comprehensive insights into your project's performance
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow duration-200 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Cards
                </CardTitle>
                <div className="w-8 h-8 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.totalCards}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                All project cards
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-200 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  Active Cards
                </CardTitle>
                <div className="w-8 h-8 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {analytics.activeCards}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Currently in progress
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-200 border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Archived Cards
                </CardTitle>
                <div className="w-8 h-8 bg-gray-500 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <Archive className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {analytics.archivedCards}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Completed items
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow duration-200 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Contributors
                </CardTitle>
                <div className="w-8 h-8 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {analytics.topContributors.length}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Active team members
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 mb-8">
          {/* Card Type Distribution */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold">Card Type Distribution</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Breakdown by card category
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={cardTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, value }: any) => (value && value > 0) ? `${name}: ${value}` : ''}
                    labelLine={false}
                  >
                    {cardTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task Status Overview */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold">Task Status Overview</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Active vs completed tasks
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={taskStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill="#22C55E" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Visibility Split */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Eye className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold">Visibility Distribution</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Public vs private content
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={visibilityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, value }: any) => (value && value > 0) ? `${name}: ${value}` : ''}
                    labelLine={false}
                  >
                    {visibilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Card Creation Over Time */}
          <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold">Card Creation Trends</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Activity over time
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={analytics.cardCreationOverTime} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="formattedDate" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {`Week of ${label}: ${payload[0].value} cards`}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Contributors */}
        {analytics.topContributors.length > 0 && (
          <Card className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <span className="text-lg font-semibold">Top Contributors</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                    Most active team members
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {analytics.topContributors.map((contributor, index) => (
                  <div key={contributor.email} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        {index < 3 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                          {contributor.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {contributor.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {contributor.count}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        cards created
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
