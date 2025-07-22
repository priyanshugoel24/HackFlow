export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
  color?: string;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

export interface ChartTooltipProps {
  payload?: {
    percentage?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ChartTooltipFormatter {
  (value: unknown, name: unknown, props: ChartTooltipProps): [string, string];
}
