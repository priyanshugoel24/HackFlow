export const timeConfig = {
  hackathon: {
    timerUpdateInterval: 1000, // 1 second
    timeUnits: {
      day: 1000 * 60 * 60 * 24,
      hour: 1000 * 60 * 60,
      minute: 1000 * 60,
      second: 1000,
    }
  },
  formatting: {
    defaultOptions: {
      timeZone: 'UTC',
      hour12: false,
    },
    relativeTime: {
      numeric: 'auto' as const,
      style: 'long' as const,
    }
  }
} as const;
