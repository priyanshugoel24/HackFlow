import React from "react";
import { FileText, Lightbulb, CheckCircle } from "lucide-react";

/**
 * Get the appropriate icon for a card type
 */
export const getTypeIcon = (cardType: string): React.ReactElement => {
  switch (cardType) {
    case "INSIGHT":
      return React.createElement(Lightbulb, { className: "h-4 w-4" });
    case "DECISION":
      return React.createElement(CheckCircle, { className: "h-4 w-4" });
    case "TASK":
    default:
      return React.createElement(FileText, { className: "h-4 w-4" });
  }
};

/**
 * Compare two arrays for equality (order independent)
 */
export const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return JSON.stringify(sortedA) === JSON.stringify(sortedB);
};

/**
 * Check if two assigned users are the same
 */
export const assignedUsersEqual = (
  a: { id: string } | null,
  b: { id: string } | null
): boolean => {
  // Both null/undefined
  if (!a && !b) return true;
  
  // One null, one not
  if (!a || !b) return false;
  
  // Compare IDs
  return a.id === b.id;
};

/**
 * Generate user avatar fallback text
 */
export const getUserAvatarFallback = (name?: string | null, email?: string | null): string => {
  return (name || email || 'U').charAt(0).toUpperCase();
};

/**
 * Extract error message from API error response
 */
export const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (
    error instanceof Error && 
    'response' in error && 
    typeof error.response === 'object' && 
    error.response !== null &&
    'data' in error.response && 
    typeof error.response.data === 'object' &&
    error.response.data !== null && 
    'error' in error.response.data
  ) {
    return String(error.response.data.error);
  }
  return fallback;
};
