"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getAblyClient } from "@/lib/ably";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 custom-scrollbar">
      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          <p>No activity yet. Start by creating context cards or adding comments!</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 bg-white shadow-sm rounded-lg p-4 border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all"
            >
              {activity.user?.image ? (
                <Image
                  src={activity.user.image}
                  alt={activity.user.name}
                  width={32}
                  height={32}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-sm font-semibold">
                  👤
                </div>
              )}

              <div>
                <p className="text-sm text-gray-800 leading-tight">
                  <span className="font-semibold text-gray-900">{activity.user?.name}</span> {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}