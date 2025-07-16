"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import axios from "axios";
import { 
  Pin, 
  Link, 
  Eye, 
  EyeOff, 
  Archive, 
  MessageSquare,
  FileText,
  Lightbulb,
  CheckCircle,
  Paperclip,
  AlertTriangle,
  Plus,
  Filter
} from "lucide-react";
import ContextCardModal from "./ContextCardModal";
import SmartComposeModal from "./SmartComposeModal";
import { useProjectRealtime } from "@/lib/ably/useProjectRealtime";
import { ContextCardWithRelations, ProjectWithRelations } from "@/types";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ContextCardList({ projectSlug }: { projectSlug: string }) {
  const [cards, setCards] = useState<ContextCardWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ContextCardWithRelations | null>(null);
  const [project, setProject] = useState<ProjectWithRelations | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [allCards, setAllCards] = useState<ContextCardWithRelations[]>([]);
  const [smartComposeOpen, setSmartComposeOpen] = useState(false);
  const [cardTypeFilter, setCardTypeFilter] = useState<'ALL' | 'TASK' | 'INSIGHT' | 'DECISION'>('ALL');

  const fetchCards = async () => {
    if (!projectSlug) return;
    
    try {
      const res = await axios.get(`/api/projects/${projectSlug}?includeArchived=true`);
      const data = res.data;
      setAllCards(data.project?.contextCards || []);
      // Filter cards based on showArchived state
      const filteredCards = data.project?.contextCards?.filter((card: any) => 
        showArchived ? true : !card.isArchived
      ) || [];
      setCards(filteredCards);
      setProject(data.project);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Real-time updates using Ably
  const { isConnected } = useProjectRealtime(
    project?.id || null,
    (newCard) => {
      console.log("📨 Real-time card created:", newCard);
      fetchCards(); // Refresh to get the latest data with proper typing
    },
    (updatedCard) => {
      console.log("📝 Real-time card updated:", updatedCard);
      fetchCards(); // Refresh to get the latest data with proper typing
    },
    (deletedCardId) => {
      console.log("🗑️ Real-time card deleted:", deletedCardId);
      // Remove the card from the list
      setAllCards(prevCards => prevCards.filter(card => card.id !== deletedCardId));
    },
    (activity) => {
      console.log("📢 Real-time activity:", activity);
      // You can handle activity updates here if needed
    }
  );

  useEffect(() => {
    fetchCards();
  }, [projectSlug]);

  // Update displayed cards when showArchived changes
  useEffect(() => {
    if (allCards.length > 0) {
      const filteredCards = allCards.filter((card: any) => 
        showArchived ? true : !card.isArchived
      );
      setCards(filteredCards);
    }
  }, [showArchived, allCards]);

  const handleCardCreated = () => {
    fetchCards(); // Refresh the cards after creating a new one
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
        <p className="mt-2">Loading context cards...</p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INSIGHT': return <Lightbulb className="h-4 w-4" />;
      case 'DECISION': return <CheckCircle className="h-4 w-4" />;
      case 'TASK': 
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INSIGHT': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'DECISION': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'TASK': 
      default: return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Sort cards: DECISION → INSIGHT → TASK
  const sortCards = (cards: ContextCardWithRelations[]) => {
    const typeOrder = { 'DECISION': 0, 'INSIGHT': 1, 'TASK': 2 };
    return [...cards].sort((a, b) => {
      const aOrder = typeOrder[a.type as keyof typeof typeOrder] ?? 3;
      const bOrder = typeOrder[b.type as keyof typeof typeOrder] ?? 3;
      return aOrder - bOrder;
    });
  };

  // Filter and sort cards
  const getDisplayedCards = () => {
    let filtered = showArchived ? allCards : allCards.filter(card => !card.isArchived);
    
    // Apply type filter
    if (cardTypeFilter !== 'ALL') {
      filtered = filtered.filter(card => card.type === cardTypeFilter);
    }
    
    // Sort the cards
    return sortCards(filtered);
  };

  const displayedCards = getDisplayedCards();

  return (
    <>
      <div className="space-y-4">
        {/* Always show the header with filters and buttons */}
        <div className="flex items-center justify-between mb-6 mt-4 gap-6">
          <h2 className="text-2xl font-extrabold dark:text-gray-100">Context Cards</h2>
          <div className="flex items-center space-x-4">
            {/* Card Type Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-3.5 w-3.5 mr-1" />
                  {cardTypeFilter === 'ALL' ? 'All Types' : cardTypeFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCardTypeFilter('ALL')}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCardTypeFilter('DECISION')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Decisions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCardTypeFilter('INSIGHT')}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Insights
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCardTypeFilter('TASK')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-1 text-xs"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="h-3.5 w-3.5 mr-1" />
              {showArchived ? "Hide Archived" : "Show Archived"}
            </Button>
            {showArchived && allCards.some(card => card.isArchived) && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing {allCards.filter(card => card.isArchived).length} archived cards
              </span>
            )}
            <Button 
              variant="secondary" 
              onClick={() => setSmartComposeOpen(true)}
            >
              ✨ Smart Compose
            </Button>
            <Button className="cursor-pointer" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>
        </div>

        {/* Conditional content: either cards or empty state */}
        {displayedCards.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium">
              {cardTypeFilter === 'ALL' ? 'No context cards found' : `No ${cardTypeFilter.toLowerCase()} cards found`}
            </p>
            <p className="text-sm mb-4">
              {cardTypeFilter === 'ALL' 
                ? 'Create your first context card for this project!' 
                : `Try switching to a different card type or create a new ${cardTypeFilter.toLowerCase()} card.`
              }
            </p>
            <div className="flex items-center justify-center space-x-2">
              <Button variant="secondary" onClick={() => setSmartComposeOpen(true)}>
                ✨ Smart Compose
              </Button>
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Context Card
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedCards.map((card) => (
              <Card
                key={card.id}
                className={cn(
                  "cursor-pointer group hover:shadow-lg dark:hover:shadow-blue-900 transition-shadow rounded-xl border p-4 hover:border-blue-500 hover:scale-[1.01] transform",
                  card.isArchived && "opacity-60",
                  card.isPinned && "ring-2 ring-blue-200 dark:ring-blue-700"
                )}
                onClick={() => setSelectedCard(card)}
              >
                <CardHeader className="pb-3 mb-2">
                  <div className="flex items-start justify-between space-y-0">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={cn("flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs", getTypeColor(card.type))}>
                        {getTypeIcon(card.type)}
                        <span className="capitalize">{card.type.toLowerCase()}</span>
                      </div>
                      {card.isPinned && (
                        <Pin className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      )}
                      {card.isArchived && (
                        <Archive className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
                      {card.visibility === 'PRIVATE' ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-500 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                  
                  <CardTitle className="text-base font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-3 text-sm leading-relaxed">
                  <p className="text-muted-foreground dark:text-muted-foreground-dark line-clamp-3">
                    {card.content}
                  </p>
                  
                  {card.why && (
                    <div className="bg-yellow-50 dark:bg-yellow-900 p-2 rounded-md">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-100">Why:</p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-200 line-clamp-2">{card.why}</p>
                    </div>
                  )}
                  
                  {card.issues && (
                    <div className="bg-red-50 dark:bg-red-900 p-2 rounded-md flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-red-800 dark:text-red-100">Issues:</p>
                        <p className="text-xs text-red-700 dark:text-red-200 line-clamp-2">{card.issues}</p>
                      </div>
                    </div>
                  )}
                  
                  {card.linkedCard && (
                    <div className="bg-blue-50 dark:bg-blue-900 p-2 rounded-md flex items-center space-x-2">
                      <Link className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                      <div>
                        <p className="text-xs font-medium text-blue-800 dark:text-blue-100">Linked to:</p>
                        <p className="text-xs text-blue-700 dark:text-blue-200 line-clamp-1">{card.linkedCard.title}</p>
                      </div>
                    </div>
                  )}
                  
                  {card.linkedFrom && card.linkedFrom.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                      <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {card.linkedFrom.length} card{card.linkedFrom.length !== 1 ? 's' : ''} linked to this
                      </p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {card.attachments && card.attachments.length > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <Paperclip className="h-3 w-3" />
                        <span>{card.attachments.length} attachment{card.attachments.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {card.attachments && card.attachments.length > 0 && (
      <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1 mt-1">
        {card.attachments.map((url : string, i : number) => (
          <a 
            key={`${card.id}-attachment-${i}-${url.split("/").pop()}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline block truncate"
          >
            {url.split("/").pop()}
          </a>
        ))}
      </div>
    )}
                    
                    {card.slackLinks && card.slackLinks.length > 0 && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <MessageSquare className="h-3 w-3" />
                        <span>{card.slackLinks.length} slack link{card.slackLinks.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Updated {formatDate(card.updatedAt)}</span>
                    <span>Created {formatDate(card.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* Always render modal if modalOpen is true and no card is selected */}
      {modalOpen && !selectedCard && (
        <ContextCardModal 
          open={modalOpen} 
          setOpen={setModalOpen} 
          projectSlug={projectSlug}
          project={project as any}
          onSuccess={handleCardCreated}
        />
      )}
      {/* Smart Compose Modal */}
      <SmartComposeModal
        open={smartComposeOpen}
        setOpen={setSmartComposeOpen}
        projectSlug={projectSlug}
        onSuccess={() => {
          fetchCards(); // Refresh cards after creating via Smart Compose
        }}
      />
      {/* Render modal for editing/viewing a card */}
      {selectedCard && (
        <ContextCardModal 
          open={!!selectedCard}
          setOpen={(val) => {
            if (!val) setSelectedCard(null);
          }}
          projectSlug={projectSlug}
          project={project as any || undefined}
          existingCard={selectedCard ? {
            ...selectedCard,
            why: selectedCard.why || undefined,
            issues: selectedCard.issues || undefined,
            slackLinks: selectedCard.slackLinks || undefined,
            attachments: selectedCard.attachments || undefined,
            status: selectedCard.status || "ACTIVE"
          } as any : undefined}
          onSuccess={() => {
            setSelectedCard(null);
            fetchCards();
          }}
        />
      )}
    </>
  );
}