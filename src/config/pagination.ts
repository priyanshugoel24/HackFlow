export const paginationConfig = {
  pageSize: 10,
  maxResults: 100,
  commentLimit: 10,
  searchDebounceDelay: 300, // milliseconds
  scrollThreshold: 100, // pixels from bottom to trigger load more
} as const;
