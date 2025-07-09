"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { FileText, Folder, User, Tag, Search, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type SearchResult = {
  type: "card" | "project" | "member" | "tag";
  id: string;
  originalId?: string;
  title?: string;
  name?: string;
  email?: string;
  tag?: string;
  projectId?: string;
  projectSlug?: string;
  slug?: string;
  projectName?: string;
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounced = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((item: SearchResult) => {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (item.type === "project") {
      router.push(`/projects/${item.slug}`);
    } else if (item.type === "card" && item.projectSlug) {
      router.push(`/projects/${item.projectSlug}?card=${item.originalId || item.id}`);
    } else if (item.type === "member" && item.projectSlug) {
      router.push(`/projects/${item.projectSlug}#members`);
    } else if (item.type === "tag" && item.projectSlug) {
      router.push(`/projects/${item.projectSlug}#tags`);
    }
  }, [router]);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setQuery("");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect]);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      setSelectedIndex(-1);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);
      setSelectedIndex(-1);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`);
        if (!res.ok) {
          throw new Error('Search failed');
        }
        const data = await res.json();
        setResults(data.results || []);
      } catch (error) {
        console.error("Search failed:", error);
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debounced]);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const grouped = {
    project: results.filter((r) => r.type === "project"),
    card: results.filter((r) => r.type === "card"),
    member: results.filter((r) => r.type === "member"),
    tag: results.filter((r) => r.type === "tag"),
  };

  const hasResults = Object.values(grouped).some(group => group.length > 0);

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Search projects, cards, members..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="block w-full pl-10 pr-12 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400 dark:text-gray-500" />
          )}
          {query && !isLoading && (
            <button
              onClick={clearSearch}
              className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-[400px] overflow-y-auto">
          {error && (
            <div className="px-4 py-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-500" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          ) : !query.trim() ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Start typing to search projects, cards, and members...
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-2">
              {grouped.project.length > 0 && (
                <div className="px-2 py-1">
                  <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Projects
                  </h3>
                  <div className="mt-1">
                    {grouped.project.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-2 text-left rounded-md transition-colors",
                          selectedIndex === results.indexOf(item)
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        )}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50 flex-shrink-0">
                          <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Project
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {grouped.card.length > 0 && (
                <div className="px-2 py-1">
                  <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Context Cards
                  </h3>
                  <div className="mt-1">
                    {grouped.card.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-2 text-left rounded-md transition-colors",
                          selectedIndex === results.indexOf(item)
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        )}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50 flex-shrink-0">
                          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            in {item.projectName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {grouped.member.length > 0 && (
                <div className="px-2 py-1">
                  <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Members
                  </h3>
                  <div className="mt-1">
                    {grouped.member.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-2 text-left rounded-md transition-colors",
                          selectedIndex === results.indexOf(item)
                            ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        )}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50 flex-shrink-0">
                          <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.email} • {item.projectName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {grouped.tag.length > 0 && (
                <div className="px-2 py-1">
                  <h3 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tags
                  </h3>
                  <div className="mt-1">
                    {grouped.tag.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className={cn(
                          "w-full flex items-center gap-3 px-2 py-2 text-left rounded-md transition-colors",
                          selectedIndex === results.indexOf(item)
                            ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                        )}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/50 flex-shrink-0">
                          <Tag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {item.tag}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            in {item.projectName}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}