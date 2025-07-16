export interface TeamAnalytics {
  // Overview stats
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  totalCards: number;
  activeMembers: number;
  taskCompletionRate: number;
  avgTimeToComplete: number;
  
  // Chart data
  projectProgress: {
    id: string;
    name: string;
    slug: string;
    totalTasks: number;
    completedTasks: number;
    progress: number;
  }[];
  weeklyVelocity: {
    week: string;
    completed: number;
  }[];
  cardTypeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  topContributors: {
    userId: string;
    userName: string;
    cardsCreated: number;
    cardsCompleted: number;
  }[];
}
