"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import ContextCardModal from "./ContextCardModal";
import { ContextCardWithRelations } from "../types";
import { useSession } from "next-auth/react";

export default function AssignedCards({
  onToggleFocusCard,
  selectedCardIds = [],
}: {
  onToggleFocusCard?: (card: ContextCardWithRelations) => void;
  selectedCardIds?: string[];
}) {

  const { data: sessionData } = useSession();
  // Use email instead of userId for consistent identification across browsers
  const userEmail = sessionData?.user?.email;
  const [cards, setCards] = useState<ContextCardWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ContextCardWithRelations | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;
  const isFetching = useRef(false);

  // Fetch cards with pagination
  const fetchCards = useCallback(async (pageNum: number) => {
    if (isFetching.current) return;
    if (!userEmail) return;
    isFetching.current = true;
    setLoading(true);
    try {
      // Fetch cards using email-based authentication (consistent across browsers)
      const res = await fetch(`/api/context-cards?assignedTo=${encodeURIComponent(userEmail)}&status=ACTIVE&offset=${pageNum * pageSize}&limit=${pageSize}`);
      const data = await res.json();
      if (Array.isArray(data.cards)) {
        setCards((prev) => {
          // Avoid duplicates
          const ids = new Set(prev.map((c) => c.id));
          const newCards = data.cards.filter((c: ContextCardWithRelations) => !ids.has(c.id));
          return [...prev, ...newCards];
        });
        setHasMore(data.cards.length === pageSize);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching assigned cards:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) {
      fetchCards(page);
    }
    // eslint-disable-next-line
  }, [page, userEmail]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || loading || !hasMore) return;
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 100) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleCardClick = (card: ContextCardWithRelations) => {
    setSelectedCard(card);
    setModalOpen(true);
  };

  // Only show cards assigned to the user and with status ACTIVE
  const visibleCards = cards.filter(
    (card) => card.status === "ACTIVE"
  );

  return (
    <div className="w-full my-8">
      <div className="flex items-center gap-2 mb-6">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4M8 3v4"/></svg>
        <h2 className="text-lg font-semibold">Your Assigned Cards</h2>
      </div>
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto py-6 pl-6 pr-4  custom-scrollbar bg-gradient-to-r from-blue-50/60 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm"
        style={{ scrollSnapType: "x mandatory", minHeight: 260 }}
      >
        {visibleCards.length === 0 && !loading && (
          <div className="text-gray-400 px-6 py-10 text-center">No active cards assigned to you.</div>
        )}
        {visibleCards.map((card) => (
          <div
            key={card.id}
            className="min-w-[360px] max-w-sm my-2 first:ml-2 bg-white dark:bg-zinc-900 border border-blue-100 dark:border-zinc-700 rounded-2xl shadow-md p-6 cursor-pointer hover:border-blue-500 hover:shadow-xl transition-all flex-shrink-0 relative group"
            style={{ scrollSnapAlign: "start" }}
            onClick={() => handleCardClick(card)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-base truncate flex-1">{card.title}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${card.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>{card.status}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">{card.type}</div>
            <div className="line-clamp-3 text-sm text-gray-700 dark:text-gray-200 mb-2">{card.content}</div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {card.project && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
                    {card.project.name}
                  </span>
                )}
                {card.why && (
                  <span className="text-xs text-gray-400 italic truncate max-w-[120px]">{card.why}</span>
                )}
              </div>
              {onToggleFocusCard && (
                <button
                  className={`text-xs px-2 py-1 rounded-md border shadow-sm ${
                    selectedCardIds.includes(card.id)
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-white text-gray-600 border-gray-300"
                  } hover:bg-gray-100 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-600`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFocusCard(card);
                  }}
                >
                  {selectedCardIds.includes(card.id) ? "✔ Added" : "🎯 Add to Focus"}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center justify-center min-w-[120px] px-4 text-gray-400 text-sm italic">Loading...</div>
        )}
      </div>
      {selectedCard && (
        <ContextCardModal
          open={modalOpen}
          setOpen={setModalOpen}
          projectSlug={selectedCard.project?.slug || ""}
          project={selectedCard.project ? {
            ...selectedCard.project,
            members: [], // Provide empty array to satisfy required prop
          } : undefined}
          existingCard={{
            ...selectedCard,
            why: selectedCard.why ?? undefined,
            issues: selectedCard.issues ?? undefined,
            slackLinks: selectedCard.slackLinks ?? undefined,
            attachments: selectedCard.attachments ?? undefined,
            status: selectedCard.status ?? "ACTIVE",
            summary: selectedCard.summary ?? undefined,
          }}
        />
      )}
    </div>
  );
}
