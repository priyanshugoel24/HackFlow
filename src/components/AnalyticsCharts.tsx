'use client';
import { memo } from 'react';
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
import { TeamAnalytics } from '@/interfaces/TeamAnalytics';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface AnalyticsChartsProps {
  analytics: TeamAnalytics;
}

const AnalyticsCharts = memo(function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  // Early return if analytics is null or undefined
  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  // Transform data for charts with proper type checking
  const cardTypeData = analytics.cardTypeDistribution?.map(item => ({
    name: String(item.type),
    value: Number(item.count) || 0,
  })) || [];

  // Since TeamAnalytics doesn't have taskStatusOverview, let's create a simple task status chart
  const taskStatusData = [
    { name: 'Completed', value: analytics.completedTasks || 0 },
    { name: 'Active', value: analytics.activeTasks || 0 },
  ];

  // Create weekly velocity data from the interface
  const weeklyVelocityData = analytics.weeklyVelocity?.map((week) => ({
    week: String(week.week || ''),
    completed: Number(week.completed) || 0,
  })) || [];

  const projectProgressData = analytics.projectProgress?.map((project) => ({
    name: String(project.name || ''),
    progress: Number(project.progress) || 0,
  })) || [];

  const memberProductivityData = analytics.topContributors?.map((contributor) => ({
    name: String(contributor.userName || ''),
    cardsCreated: Number(contributor.cardsCreated) || 0,
    cardsCompleted: Number(contributor.cardsCompleted) || 0,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Distribution */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: unknown) => [String(value), 'Count']}
                labelFormatter={(label: unknown) => `Status: ${String(label)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Card Type Distribution */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Card Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cardTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: unknown) => [String(value), 'Count']}
                labelFormatter={(label: unknown) => `Type: ${String(label)}`}
              />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Velocity */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Weekly Velocity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyVelocityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip 
                formatter={(value: unknown, name: unknown) => [String(value), String(name)]}
                labelFormatter={(label: unknown) => `Week: ${String(label)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#8884d8" name="Completed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Member Productivity */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberProductivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: unknown, name: unknown) => [String(value), String(name)]}
                labelFormatter={(label: unknown) => `Member: ${String(label)}`}
              />
              <Legend />
              <Bar dataKey="cardsCreated" fill="#8884d8" name="Cards Created" />
              <Bar dataKey="cardsCompleted" fill="#82ca9d" name="Cards Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wide Charts */}
      <div className="space-y-6">
        {/* Project Progress */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Project Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: unknown) => [String(value), 'Progress']}
                labelFormatter={(label: unknown) => `Project: ${String(label)}`}
              />
              <Legend />
              <Bar dataKey="progress" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
});

export default AnalyticsCharts;
