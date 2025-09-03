export interface SearchableItem {
  title?: string;
  name?: string;
  email?: string;
  tag?: string;
  [key: string]: unknown;
}