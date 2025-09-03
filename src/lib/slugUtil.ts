import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a URL-friendly slug from a string
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Generate a unique slug by appending a random string if needed
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[] = []
): string {
  let slug = baseSlug;
  let counter = 1;

  // If the base slug is already unique, return it
  if (!existingSlugs.includes(slug)) {
    return slug;
  }

  // Keep trying with incremented numbers until we find a unique slug
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
