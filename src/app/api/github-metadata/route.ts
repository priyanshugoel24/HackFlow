import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET
  });
  if (!token?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubToken = token?.githubAccessToken;

  let url: string;
  try {
    const body = await req.json();
    url = body.url;
    if (typeof url !== "string") throw new Error("Invalid payload");
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const match = url.match(
    /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)$/
  );

  if (!match) {
    return NextResponse.json({ error: "Invalid GitHub issue/PR URL" }, { status: 400 });
  }

  const [, owner, repo, type, number] = match;

  const apiUrl =
    type === "issues"
      ? `https://api.github.com/repos/${owner}/${repo}/issues/${number}`
      : `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken || process.env.GITHUB_TOKEN}`,
      },
    });

    const data = res.data;

    return NextResponse.json({
      title: data.title,
      body: data.body,
      number: data.number,
      repo: `${owner}/${repo}`,
      type,
      url: data.html_url,
    });
  } catch (err) {
    console.error("GitHub fetch failed:", err);
    if (axios.isAxiosError(err) && err.response) {
      return NextResponse.json({ error: "GitHub API error" }, { status: err.response.status });
    }
    return NextResponse.json({ error: "Failed to fetch GitHub data" }, { status: 500 });
  }
}
