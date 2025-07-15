// src/app/api/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";
import { getGlobalSearchData } from "@/lib/searchData";
import { sanitizeSearchQuery } from "@/lib/security";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().min(1).max(100),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    const parsed = querySchema.safeParse({ q: query });
    if (!parsed.success) {
      return NextResponse.json({ results: [] }, { status: 400 });
    }

    // Sanitize the search query to prevent injection attacks
    const sanitizedQuery = sanitizeSearchQuery(parsed.data.q);
    if (!sanitizedQuery) {
      return NextResponse.json({ results: [] });
    }

    const data = await getGlobalSearchData();

    const fuse = new Fuse(data, {
      keys: ["title", "name", "email", "tag", "description", "teamName"],
      threshold: 0.3, // Fuzzy level
      includeScore: true,
      includeMatches: true,
    });

    const results = fuse.search(sanitizedQuery)
      .sort((a, b) => (a.score || 0) - (b.score || 0)) // Sort by relevance
      .slice(0, 20) // Limit results
      .map((r) => r.item);

    return NextResponse.json({ results, query: sanitizedQuery });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", results: [] }, 
      { status: 500 }
    );
  }
}