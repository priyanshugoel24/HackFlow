'use client';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface AnalyticsChartsProps {
  analytics: any;
}

export default function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  // Early return if analytics is null or undefined
  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  // Transform data for charts with proper type checking
  const cardTypeData = Object.entries(analytics.cardTypeDistribution || {}).map(([type, count]) => ({
    name: String(type),
    value: Number(count) || 0,
  }));

  const taskStatusData = Object.entries(analytics.taskStatusOverview || {}).map(([status, count]) => ({
    name: String(status),
    value: Number(count) || 0,
  }));

  const visibilityData = Object.entries(analytics.visibilityDistribution || {}).map(([visibility, count]) => ({
    name: String(visibility),
    value: Number(count) || 0,
  }));

  const completionTrendData = analytics.completionTrends?.map((trend: any) => ({
    month: String(trend.month || ''),
    completed: Number(trend.completed) || 0,
    total: Number(trend.total) || 0,
  })) || [];

  const projectProgressData = analytics.projectProgress?.map((project: any) => ({
    name: String(project.name || ''),
    progress: Number(project.progress) || 0,
  })) || [];

  const memberProductivityData = analytics.memberProductivity?.map((member: any) => ({
    name: String(member.name || ''),
    completedTasks: Number(member.completedTasks) || 0,
    totalTasks: Number(member.totalTasks) || 0,
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
                formatter={(value: any) => [String(value), 'Count']}
                labelFormatter={(label: any) => `Status: ${String(label)}`}
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
                formatter={(value: any) => [String(value), 'Count']}
                labelFormatter={(label: any) => `Type: ${String(label)}`}
              />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visibility Distribution */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Visibility Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={visibilityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {visibilityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [String(value), 'Count']}
                labelFormatter={(label: any) => `Visibility: ${String(label)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Trends */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Completion Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={completionTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: any) => [String(value), String(name)]}
                labelFormatter={(label: any) => `Month: ${String(label)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#8884d8" name="Completed" />
              <Line type="monotone" dataKey="total" stroke="#82ca9d" name="Total" />
            </LineChart>
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
                formatter={(value: any) => [String(value), 'Progress']}
                labelFormatter={(label: any) => `Project: ${String(label)}`}
              />
              <Legend />
              <Bar dataKey="progress" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Member Productivity */}
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Member Productivity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberProductivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: any) => [String(value), String(name)]}
                labelFormatter={(label: any) => `Member: ${String(label)}`}
              />
              <Legend />
              <Bar dataKey="completedTasks" fill="#8884d8" name="Completed Tasks" />
              <Bar dataKey="totalTasks" fill="#82ca9d" name="Total Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
