export interface TopContributorsChartProps {
  data: Array<{
    userName: string;
    cardsCreated: number;
    cardsCompleted: number;
  }>;
}
