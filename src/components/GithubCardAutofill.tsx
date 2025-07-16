"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { GithubIcon } from "lucide-react";
import axios from "axios";
import { GitHubCardAutoFillProps } from "@/interfaces/GitHubCardAutoFillProps";

export function GitHubCardAutoFill({ onAutoFill }: GitHubCardAutoFillProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBlur = async () => {
    if (!url.includes("github.com")) return;

    setIsLoading(true);

    try {
      const res = await axios.post("/api/github-metadata", { url });
      const data = res.data;

      onAutoFill(
        data.title,
        `${data.body ?? ""}\n\n🔗 [View on GitHub](${data.url})`
      );

      toast.success("GitHub issue imported");
    } catch {
      toast.error("Failed to import GitHub issue or PR");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="github-url" className="flex items-center gap-2">
        <GithubIcon className="w-4 h-4" /> GitHub Issue/PR Link
      </Label>

      <div className="relative">
        <Input
          id="github-url"
          type="url"
          placeholder="https://github.com/user/repo/issues/123"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleBlur}
          disabled={isLoading}
          className="pl-10"
        />

        <GithubIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {isLoading && <Skeleton className="h-20 rounded-md w-full" />}
    </div>
  );
}