export const focusModeConfig = {
  motivationalQuotes: [
    "Focus is the key to productivity! 🔑",
    "Every task completed is a step forward! 🚀",
    "You're building great habits! 💪",
    "Consistency is the mother of mastery! ⭐",
    "Small progress is still progress! 🌱"
  ],
  pomodoro: {
    defaultWorkDuration: 25, // minutes
    defaultBreakDuration: 5, // minutes
  },
  timerIntervals: {
    pomodoro: 1000, // 1 second
    taskTimer: 1000, // 1 second
  }
} as const;
