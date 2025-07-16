export const cardConfig = {
  typeOrder: { 'DECISION': 0, 'INSIGHT': 1, 'TASK': 2 } as const,
  typeIcons: {
    INSIGHT: 'Lightbulb',
    DECISION: 'CheckCircle',
    TASK: 'FileText',
  } as const,
  typeColors: {
    INSIGHT: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
    DECISION: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
    TASK: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
  } as const,
  dateFormat: {
    options: {
      month: 'short' as const,
      day: 'numeric' as const,
      hour: '2-digit' as const,
      minute: '2-digit' as const,
    },
    locale: 'en-US',
  }
} as const;
