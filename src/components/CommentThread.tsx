"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getAblyClient } from "@/lib/ably";

export default function CommentThread({ cardId }: { cardId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);

  const fetchComments = async (cursor?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/context-cards/${cardId}/comments?limit=10${cursor ? `&cursor=${cursor}` : ""}`);
      const data = await res.json();

      if (res.ok) {
        if (cursor) {
          // For pagination, append older comments and ensure no duplicates
          setComments((prev) => {
            const commentMap = new Map();
            
            // Add existing comments
            prev.forEach(comment => {
              commentMap.set(comment.id, comment);
            });
            
            // Add new comments
            data.comments.forEach((comment: any) => {
              commentMap.set(comment.id, comment);
            });
            
            // Return sorted array
            return Array.from(commentMap.values()).sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
        } else {
          // For initial load, replace all comments
          setComments(data.comments);
        }
        setNextCursor(data.nextCursor ?? null);
      }
    } catch (err) {
      console.error("Error loading comments", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!cardId) return;

    setComments([]);
    setNextCursor(null);
    setNewComment("");
    fetchComments();

    const ably = getAblyClient();
    const channel = ably.channels.get(`card:${cardId}:comments`);

    const handleNewComment = (msg: any) => {
      setComments((prev) => {
        // Create a Map for O(1) lookup performance and deduplication
        const commentMap = new Map();
        
        // Add existing comments to the map
        prev.forEach(comment => {
          commentMap.set(comment.id, comment);
        });
        
        // Add or update the new comment
        commentMap.set(msg.data.id, msg.data);
        
        // Convert back to array and sort by createdAt
        return Array.from(commentMap.values()).sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    };

    channel.subscribe("comment:created", handleNewComment);

    return () => {
      channel.unsubscribe("comment:created", handleNewComment);
      channel.once("attached", () => {
        channel.detach();
        channel.once("detached", () => {
          ably.channels.release(`card:${cardId}:comments`);
        });
      });
    };
  }, [cardId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/context-cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment("");
        // Don't manually add the comment here since it will come through the real-time subscription
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 mt-4 border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-white">💬 Comments</h4>

      {/* New Comment Input */}
      <div className="flex items-start gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={session?.user?.image || ""} />
          <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={2}
            placeholder="Write a comment..."
            className="w-full text-sm"
          />
          <Button
            size="sm"
            className="text-sm"
            onClick={handleAddComment}
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </div>

      {nextCursor && (
  <div className="text-center mb-4">
    <button
      onClick={() => fetchComments(nextCursor)}
      className="text-sm px-4 py-2 rounded bg-muted hover:bg-gray-200 transition"
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Load more comments"}
    </button>
  </div>
)}

      {/* Comment List */}
      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={c.author.image} />
              <AvatarFallback>{c.author.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-4 py-2 w-full">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{c.author.name}</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{c.content}</p>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(c.createdAt))} ago
              </div>
            </div>
          </div>
        ))}
        
        {/* Load More Button */}
        {nextCursor && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchComments(nextCursor)}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load More Comments"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}