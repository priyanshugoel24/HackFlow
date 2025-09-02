import { Users, Brain, CheckCircle2 } from 'lucide-react';

/**
 * Hero section feature configurations
 */
export const HERO_FEATURES = [
  {
    icon: Users,
    title: "Real-time Collaborative Editing",
    description: "Work together seamlessly with your team in real-time"
  },
  {
    icon: CheckCircle2,
    title: "Team-based Projects with Task Tracking",
    description: "Organize projects and track progress with powerful task management"
  },
  {
    icon: Brain,
    title: "AI-powered Summaries and Digests",
    description: "Get intelligent insights and automated summaries of your work"
  }
] as const;
