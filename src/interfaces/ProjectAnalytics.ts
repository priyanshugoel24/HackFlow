export interface ProjectAnalytics {
  project: {
    name: string;
  };
  totalCards: number;
  activeCards: number;
  completedCards: number;
  archivedCards: number;
  cardTypeDistribution: Record<string, number>;
  taskStatusOverview: {
    ACTIVE: number;
    CLOSED: number;
  };
  visibilityDistribution: Record<string, number>;
  topContributors: Array<{
    id: string;
    name: string;
    email: string;
    cardsAssigned: number;
    cardCount: number;
  }>;
  members: Array<{
    id: string;
    name: string;
    email: string;
    cardsAssigned: number;
  }>;
  cardsByType: Array<{
    type: string;
    count: number;
  }>;
  cardsByStatus: Array<{
    status: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}
