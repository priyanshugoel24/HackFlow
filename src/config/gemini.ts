export const geminiConfig = {
  MODEL: "gemini-2.5-flash",
  MAX_OUTPUT_TOKENS: 1200,
  TEMPERATURE: 0.7,
  
  // For summarization
  SUMMARIZE_MODEL: "gemini-2.5-flash",
  SUMMARIZE_MAX_TOKENS: 150,
  
  // For content parsing
  PARSE_MODEL: "gemini-2.5-flash",
  
  // For assistant
  ASSISTANT_MODEL: "gemini-2.5-flash",
  ASSISTANT_MAX_TOKENS: 1200,
  ASSISTANT_TEMPERATURE: 0.7,
} as const;
