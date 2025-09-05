'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmartComposeForm } from "@/components/forms";
import { SmartComposeModalProps } from "@/interfaces/ModalInterfaces";

export default function SmartComposeModal({
  open,
  setOpen,
  projectSlug,
  onSuccess,
}: SmartComposeModalProps) {
  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="min-w-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle>Smart Compose with AI</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <SmartComposeForm 
            projectId={projectSlug} 
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
