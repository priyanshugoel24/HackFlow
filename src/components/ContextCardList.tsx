"use client";
import { useEffect, useState, useMemo, useCallback, memo } from "react";
import dynamic from 'next/dynamic';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/slugUtil";
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

// Lazy load heavy modal components
const ContextCardModal = dynamic(() => import('./ContextCardModal'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-96 rounded-lg" />
});

const SmartComposeModal = dynamic(() => import('./SmartComposeModal'), {
  loading: () => <div>Loading AI composer...</div>
});
import { useProjectRealtime } from "@/lib/ably/useProjectRealtime";
import { ContextCardWithRelations } from "@/interfaces/ContextCardWithRelations";
import { ProjectWithRelations } from "@/interfaces/ProjectWithRelations";
import { cardConfig } from '@/config/cards';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ErrorBoundary from './ErrorBoundary';

// Memoized individual card component to prevent unnecessary re-renders
const ContextCard = memo(function ContextCard({
  card,
  onCardClick,
  getTypeIcon,
  getTypeColor,
  formatDate,
}: {
  card: ContextCardWithRelations;
  onCardClick: (card: ContextCardWithRelations) => void;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeColor: (type: string) => string;
  formatDate: (dateString: string | Date) => string;
}) {
  const handleClick = useCallback(() => {
    onCardClick(card);
  }, [card, onCardClick]);

  return (
    <Card
      className={cn(
        "cursor-pointer group hover:shadow-lg dark:hover:shadow-blue-900 transition-shadow rounded-xl border p-4 hover:border-blue-500 hover:scale-[1.01] transform",
        card.isArchived && "opacity-60",
        card.isPinned && "ring-2 ring-blue-200 dark:ring-blue-700"
      )}
      onClick={handleClick}
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
              {card.attachments.map((url: string, i: number) => (
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
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Updated {formatDate(card.updatedAt)}</span>
          <span>Created {formatDate(card.createdAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
});

// Memoized virtualized card component for large lists
const VirtualizedContextCard = memo(function VirtualizedContextCard({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: {
    cards: ContextCardWithRelations[];
    onCardClick: (card: ContextCardWithRelations) => void;
    getTypeIcon: (type: string) => React.ReactNode;
    getTypeColor: (type: string) => string;
    formatDate: (dateString: string | Date) => string;
  };
}) {
  const { cards, onCardClick, getTypeIcon, getTypeColor, formatDate } = data;
  const card = cards[index];
  
  const handleClick = useCallback(() => {
    onCardClick(card);
  }, [card, onCardClick]);
  
  if (!card) return null;

  return (
    <div style={style} className="px-4 py-2">
      <Card
        className={cn(
          "cursor-pointer group hover:shadow-lg dark:hover:shadow-blue-900 transition-shadow rounded-xl border p-4 hover:border-blue-500 hover:scale-[1.01] transform",
          card.isArchived && "opacity-60",
          card.isPinned && "ring-2 ring-blue-200 dark:ring-blue-700"
        )}
        onClick={handleClick}
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
        </div>          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Updated {formatDate(card.updatedAt)}</span>
            <span>Created {formatDate(card.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

import { ContextCardListProps } from '@/interfaces/ContextCardListProps';

const ContextCardList = memo(function ContextCardList({ 
  projectSlug, 
  initialCards = [], 
  project: initialProject,
  teamSlug 
}: ContextCardListProps) {
  // Add hydration flag to prevent hydration mismatches
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ContextCardWithRelations | null>(null);
  const [project, setProject] = useState<ProjectWithRelations | null>(initialProject || null);
  const [showArchived, setShowArchived] = useState(false);
  const [allCards, setAllCards] = useState<ContextCardWithRelations[]>(initialCards);
  const [smartComposeOpen, setSmartComposeOpen] = useState(false);
  const [cardTypeFilter, setCardTypeFilter] = useState<'ALL' | 'TASK' | 'INSIGHT' | 'DECISION'>('ALL');

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize utility functions to prevent recreation on every render
  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'INSIGHT': return <Lightbulb className="h-4 w-4" />;
      case 'DECISION': return <CheckCircle className="h-4 w-4" />;
      case 'TASK': 
      default: return <FileText className="h-4 w-4" />;
    }
  }, []);

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'INSIGHT': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'DECISION': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'TASK': 
      default: return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
    }
  }, []);

  const formatDate = useCallback((dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    
    // Use a more stable date format to avoid hydration mismatches
    // Only show the date part without time to avoid timezone issues
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    
    try {
      return date.toLocaleDateString('en-US', options);
    } catch {
      // Fallback for invalid dates
      return 'Invalid date';
    }
  }, []);

  // Memoize card sorting function
  const sortCards = useCallback((cards: ContextCardWithRelations[]) => {
    return [...cards].sort((a, b) => {
      const aOrder = cardConfig.typeOrder[a.type as keyof typeof cardConfig.typeOrder] ?? 3;
      const bOrder = cardConfig.typeOrder[b.type as keyof typeof cardConfig.typeOrder] ?? 3;
      return aOrder - bOrder;
    });
  }, []);

  // Memoize filtered and sorted cards
  const displayedCards = useMemo(() => {
    let filtered = showArchived ? allCards : allCards.filter(card => !card.isArchived);
    
    // Apply type filter
    if (cardTypeFilter !== 'ALL') {
      filtered = filtered.filter(card => card.type === cardTypeFilter);
    }
    
    // Sort the cards
    return sortCards(filtered);
  }, [allCards, showArchived, cardTypeFilter, sortCards]);

  // Memoize card click handler
  const handleCardClick = useCallback((card: ContextCardWithRelations) => {
    setSelectedCard(card);
    setModalOpen(true);
  }, []);

  // Memoize virtualization data
  const virtualizationData = useMemo(() => ({
    cards: displayedCards,
    onCardClick: handleCardClick,
    getTypeIcon,
    getTypeColor,
    formatDate,
  }), [displayedCards, handleCardClick, getTypeIcon, getTypeColor, formatDate]);

  // Use virtualization for large lists (threshold: 50 cards)
  // Use stable virtualization threshold to prevent hydration mismatches
  const shouldVirtualize = isClient && displayedCards.length > 50;

  // Memoize modal open handler
  const handleModalOpen = useCallback(() => {
    setModalOpen(true);
  }, []);

  // Memoize smart compose handler
  const handleSmartComposeOpen = useCallback(() => {
    setSmartComposeOpen(true);
  }, []);

  // Memoize filter handlers
  const handleArchiveToggle = useCallback(() => {
    setShowArchived(prev => !prev);
  }, []);

  const handleFilterChange = useCallback((filter: 'ALL' | 'TASK' | 'INSIGHT' | 'DECISION') => {
    setCardTypeFilter(filter);
  }, []);

  // Memoize refresh function
  const refreshCards = useCallback(async () => {
    if (!project?.id) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/context-cards?projectId=${project.id}&limit=100`);
      const updatedCards: ContextCardWithRelations[] = response.data;
      setAllCards(updatedCards);
    } catch (error) {
      console.error('Error refreshing cards:', error);
      // Fallback to page reload only if API call fails
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  const handleCardCreated = useCallback(() => {
    refreshCards();
  }, [refreshCards]);

  // Update cards when initialCards prop changes
  useEffect(() => {
    setAllCards(initialCards);
  }, [initialCards]);

  // Update project when initialProject prop changes
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    }
  }, [initialProject]);

  // Real-time updates using Ably
  useProjectRealtime(
    project?.id || null,
    () => {
      refreshCards();
    },
    () => {
      refreshCards();
    },
    (deletedCardId) => {
      setAllCards(prevCards => prevCards.filter(card => card.id !== deletedCardId));
    },
    () => {
      // Handle activity updates if needed
    }
  );

  // Update displayed cards when showArchived changes
  // Show loading during hydration to prevent mismatches
  if (!isClient) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
        <p className="mt-2">Initializing...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
        <p className="mt-2">Loading context cards...</p>
      </div>
    );
  }

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
                <DropdownMenuItem onClick={() => handleFilterChange('ALL')}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('DECISION')}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Decisions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('INSIGHT')}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Insights
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('TASK')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center space-x-1 text-xs"
              onClick={handleArchiveToggle}
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
              onClick={handleSmartComposeOpen}
            >
              ✨ Smart Compose
            </Button>
            <Button className="cursor-pointer" onClick={handleModalOpen}>
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
              <Button variant="secondary" onClick={handleSmartComposeOpen}>
                ✨ Smart Compose
              </Button>
              <Button onClick={handleModalOpen}>
                <Plus className="h-4 w-4 mr-2" />
                Add Context Card
              </Button>
            </div>
          </div>
        ) : (
          <>
            {shouldVirtualize ? (
              // Use virtualization for large lists
              <div className="border rounded-lg bg-white dark:bg-gray-900">
                <List
                  height={600} // Fixed height for virtualization
                  width="100%" // Required width property
                  itemCount={displayedCards.length}
                  itemSize={280} // Approximate height per card
                  itemData={virtualizationData}
                  overscanCount={5} // Render 5 extra items for smoother scrolling
                >
                  {VirtualizedContextCard}
                </List>
              </div>
            ) : (
              // Use regular grid for smaller lists
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {displayedCards.map((card) => (
                  <ContextCard
                    key={card.id}
                    card={card}
                    onCardClick={handleCardClick}
                    getTypeIcon={getTypeIcon}
                    getTypeColor={getTypeColor}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {/* Always render modal if modalOpen is true and no card is selected */}
      {modalOpen && !selectedCard && (
        <ErrorBoundary
          fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Unable to load card editor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an error loading the card creation form.
                </p>
                <Button onClick={() => setModalOpen(false)}>Close</Button>
              </div>
            </div>
          }
        >
          <ContextCardModal 
            open={modalOpen} 
            setOpen={setModalOpen} 
            projectSlug={projectSlug}
            project={project || undefined}
            teamSlug={teamSlug}
            onSuccess={handleCardCreated}
          />
        </ErrorBoundary>
      )}
      {/* Smart Compose Modal */}
      <ErrorBoundary
        fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">AI Composer Unavailable</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The AI composer is currently unavailable. Please try again later.
              </p>
              <Button onClick={() => setSmartComposeOpen(false)}>Close</Button>
            </div>
          </div>
        }
      >
        <SmartComposeModal
          open={smartComposeOpen}
          setOpen={setSmartComposeOpen}
          projectSlug={projectSlug}
          onSuccess={handleCardCreated}
        />
      </ErrorBoundary>
      {/* Render modal for editing/viewing a card */}
      {selectedCard && (
        <ErrorBoundary
          fallback={
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Unable to load card</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  There was an error loading the card details.
                </p>
                <Button onClick={() => setSelectedCard(null)}>Close</Button>
              </div>
            </div>
          }
        >
          <ContextCardModal 
            open={!!selectedCard}
            setOpen={(val) => {
              if (!val) {
                setSelectedCard(null);
                // Ensure add card modal doesn't appear after closing existing card modal
                setModalOpen(false);
              }
            }}
            projectSlug={projectSlug}
            project={project || undefined}
            teamSlug={teamSlug}
            existingCard={selectedCard ? {
              ...selectedCard,
              why: selectedCard.why || undefined,
              issues: selectedCard.issues || undefined,
              attachments: selectedCard.attachments || undefined,
              summary: selectedCard.summary || undefined,
              status: selectedCard.status || "ACTIVE"
            } : undefined}
            onSuccess={() => {
              setSelectedCard(null);
              setModalOpen(false); // Ensure add card modal doesn't appear
              refreshCards();
            }}
          />
        </ErrorBoundary>
      )}
    </>
  );
});

export default ContextCardList;