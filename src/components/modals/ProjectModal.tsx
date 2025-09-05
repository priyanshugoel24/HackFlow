'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectForm } from "@/components/forms";
import { ProjectModalProps } from "@/interfaces/ModalInterfaces";

export default function ProjectModal({ 
  open, 
  setOpen, 
  onSuccess,
  teamId
}: ProjectModalProps) {
  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-gray-900 shadow-2xl rounded-xl p-8">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Create a New Project
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <ProjectForm teamId={teamId} onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
