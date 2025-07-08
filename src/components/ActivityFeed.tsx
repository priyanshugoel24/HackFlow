"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient } from "@/lib/ably";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import type * as Ably from 'ably';

interface ActivityFeedProps {
  projectId?: string;
  slug?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function ActivityFeed({ projectId, slug }: ActivityFeedProps) {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualProjectId, setActualProjectId] = useState<string | null>(null);

  const identifier = projectId || slug;

  useEffect(() => {
    if (!identifier) return;

    const fetchActivities = async () => {
      try {
        const res = await fetch(`/api/projects/${identifier}/activities`);
        const data = await res.json();
        setActivities(data.activities || []);
        
        // If we used slug, we need to get the actual projectId for Ably channel
        if (slug && !projectId) {
          const projectRes = await fetch(`/api/projects/${identifier}`);
          const projectData = await projectRes.json();
          if (projectData.project?.id) {
            setActualProjectId(projectData.project.id);
          }
        } else if (projectId) {
          setActualProjectId(projectId);
        }
      } catch (err) {
        console.error("Failed to fetch activity log:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [identifier, projectId, slug]);

  useEffect(() => {
    if (!actualProjectId || !session?.user?.id) return;

    console.log("🔌 ActivityFeed connecting to Ably for project:", actualProjectId);
    
    const ably = getAblyClient(session.user.id);
    const channel = ably.channels.get(`project:${actualProjectId}`);

    const handleNewActivity = (msg: Ably.Message) => {
      console.log("📨 ActivityFeed received activity:", msg.name, msg.data);
      if (msg.name === "activity:created") {
        const activityData = msg.data as Activity;
        setActivities((prev) => [activityData, ...prev]);
      }
    };

    channel.subscribe("activity:created", handleNewActivity);

    return () => {
      console.log("🔇 ActivityFeed unsubscribing from project:", actualProjectId);
      channel.unsubscribe("activity:created", handleNewActivity);
      channel.once("attached", () => {
        channel.detach();
        channel.once("detached", () => {
          ably.channels.release(`project:${actualProjectId}`);
        });
      });
      
    };
  }, [actualProjectId, session?.user?.id]);

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No activity yet. Start by creating context cards or adding comments!</p>
        </div>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            {activity.user?.image ? (
              <Image
                src={activity.user.image}
                alt={activity.user.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm">
                {activity.user?.name?.[0] || "?"}
              </div>
            )}

            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{activity.user?.name}</span> {activity.description}
              </p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}