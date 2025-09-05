'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { InvitationForm } from "@/components/forms";
import { InviteMemberModalProps } from "@/interfaces/ModalInterfaces";

export default function InviteMemberModal({ 
  teamSlug, 
  open: controlledOpen, 
  setOpen: setControlledOpen, 
  onInviteSent,
  triggerButton = true 
}: InviteMemberModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen || setInternalOpen;

  const handleSuccess = () => {
    setIsOpen(false);
    onInviteSent?.();
  };

  const content = (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Invite Team Member</DialogTitle>
      </DialogHeader>
      
      <div className="py-4">
        <InvitationForm teamSlug={teamSlug} onSuccess={handleSuccess} />
      </div>
    </DialogContent>
  );

  if (triggerButton) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {content}
    </Dialog>
  );
}
