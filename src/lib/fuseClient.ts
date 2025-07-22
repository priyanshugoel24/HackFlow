import Fuse from "fuse.js";

interface SearchableItem {
  title?: string;
  name?: string;
  email?: string;
  tag?: string;
  [key: string]: unknown;
}

let fuse: Fuse<SearchableItem> | null = null;

export function initFuse(data: SearchableItem[]) {
  fuse = new Fuse(data, {
    includeScore: true,
    threshold: 0.3,
    keys: [
      "title",
      "name",
      "email",
      "tag",
    ],
  });
}

export function searchFuse(query: string) {
  if (!fuse) return [];
  return fuse.search(query).map((result) => result.item);
}