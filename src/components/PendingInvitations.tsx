"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Mail, User, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  status: string;
  joinedAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    link?: string;
    tags: string[];
    createdAt: string;
    lastActivityAt: string;
  };
  addedBy: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  } | null;
}

export default function PendingInvitations({ onInvitationAccepted }: { onInvitationAccepted?: () => void }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations");
      const data = await res.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to fetch invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (projectSlug: string, invitationId: string) => {
    setProcessingIds(prev => new Set(prev).add(invitationId));
    
    try {
      const res = await fetch(`/api/projects/${projectSlug}/accept-invite`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Invitation accepted! Project added to your dashboard.");
        // Remove from invitations list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        // Notify parent component to refresh project list
        onInvitationAccepted?.();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to accept invitation");
      }
    } catch (error) {
      toast.error("Error accepting invitation");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const handleDecline = async (projectSlug: string, invitationId: string) => {
    setProcessingIds(prev => new Set(prev).add(invitationId));
    
    try {
      const res = await fetch(`/api/projects/${projectSlug}/decline-invite`, {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Invitation declined");
        // Remove from invitations list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to decline invitation");
      }
    } catch (error) {
      toast.error("Error declining invitation");
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No pending invitations</p>
        <p className="text-sm">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Pending Invitations ({invitations.length})
      </h2>
      
      {invitations.map((invitation) => (
        <Card key={invitation.id} className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base font-semibold text-gray-900">
                  {invitation.project.name}
                </CardTitle>
                {invitation.project.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {invitation.project.description}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                Pending
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                {invitation.addedBy && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Invited by {invitation.addedBy.name || invitation.addedBy.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(invitation.joinedAt)}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {invitation.role}
              </Badge>
            </div>
            
            {invitation.project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {invitation.project.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {invitation.project.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{invitation.project.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => handleAccept(invitation.project.slug, invitation.id)}
                disabled={processingIds.has(invitation.id)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                {processingIds.has(invitation.id) ? "Accepting..." : "Accept"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecline(invitation.project.slug, invitation.id)}
                disabled={processingIds.has(invitation.id)}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                {processingIds.has(invitation.id) ? "Declining..." : "Decline"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
