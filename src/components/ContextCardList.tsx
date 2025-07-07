"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  ExternalLink,
  Paperclip,
  AlertTriangle,
  Plus
} from "lucide-react";
import ContextCardModal from "./ContextCardModal";

export default function ContextCardList({ projectId }: { projectId: string }) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  const fetchCards = async () => {
    if (!projectId) return;
    
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      setCards(data.project?.contextCards || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [projectId]);

  useEffect(() => {
    // Real-time updates are now handled via Ably websockets
    console.log("📝 ContextCardList initialized with Ably real-time support");
  }, [projectId]);

  const handleCardCreated = () => {
    fetchCards(); // Refresh the cards after creating a new one
  };

  if (loading) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
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
      case 'INSIGHT': return 'bg-yellow-100 text-yellow-800';
      case 'DECISION': return 'bg-green-100 text-green-800';
      case 'TASK': 
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-10">
        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No context cards found</p>
        <p className="text-sm mb-4">Create your first context card for this project!</p>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Context Card
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Context Cards</h2>
        <Button className="cursor-pointer" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            className={cn(
              "cursor-pointer group hover:shadow-lg transition-shadow",
              card.isArchived && "opacity-60",
              card.isPinned && "ring-2 ring-blue-200"
            )}
            onClick={() => setSelectedCard(card)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between space-y-0">
                <div className="flex items-center space-x-2 flex-1">
                  <div className={cn("flex items-center space-x-1 px-2 py-1 rounded-full text-xs", getTypeColor(card.type))}>
                    {getTypeIcon(card.type)}
                    <span className="capitalize">{card.type.toLowerCase()}</span>
                  </div>
                  {card.isPinned && (
                    <Pin className="h-4 w-4 text-blue-500" />
                  )}
                  {card.isArchived && (
                    <Archive className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  {card.visibility === 'PRIVATE' ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              
              <CardTitle className="text-base font-semibold group-hover:text-blue-600 line-clamp-2">
                {card.title}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {card.content}
              </p>
              
              {card.why && (
                <div className="bg-yellow-50 p-2 rounded-md">
                  <p className="text-xs font-medium text-yellow-800">Why:</p>
                  <p className="text-xs text-yellow-700 line-clamp-2">{card.why}</p>
                </div>
              )}
              
              {card.issues && (
                <div className="bg-red-50 p-2 rounded-md flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-800">Issues:</p>
                    <p className="text-xs text-red-700 line-clamp-2">{card.issues}</p>
                  </div>
                </div>
              )}
              
              {card.linkedCard && (
                <div className="bg-blue-50 p-2 rounded-md flex items-center space-x-2">
                  <Link className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">Linked to:</p>
                    <p className="text-xs text-blue-700 line-clamp-1">{card.linkedCard.title}</p>
                  </div>
                </div>
              )}
              
              {card.linkedFrom && card.linkedFrom.length > 0 && (
                <div className="bg-gray-50 p-2 rounded-md">
                  <p className="text-xs font-medium text-gray-800">
                    {card.linkedFrom.length} card{card.linkedFrom.length !== 1 ? 's' : ''} linked to this
                  </p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-1">
                {card.attachments && card.attachments.length > 0 && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Paperclip className="h-3 w-3" />
                    <span>{card.attachments.length} attachment{card.attachments.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                {card.attachments && card.attachments.length > 0 && (
  <div className="text-xs text-blue-600 space-y-1 mt-1">
    {card.attachments.map((url : string, i : number) => (
      <a 
        key={i}
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
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <MessageSquare className="h-3 w-3" />
                    <span>{card.slackLinks.length} slack link{card.slackLinks.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <span>Updated {formatDate(card.updatedAt)}</span>
                <span>Created {formatDate(card.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {!selectedCard && (
        <ContextCardModal 
          open={modalOpen} 
          setOpen={setModalOpen} 
          projectId={projectId}
          onSuccess={handleCardCreated}
        />
      )}
      
      <ContextCardModal 
        open={!!selectedCard}
        setOpen={(val) => {
          if (!val) setSelectedCard(null);
        }}
        projectId={projectId}
        existingCard={selectedCard}
        onSuccess={() => {
          setSelectedCard(null);
          fetchCards();
        }}
      />
    </div>
  );
}