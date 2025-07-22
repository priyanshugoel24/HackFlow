"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import axios from "axios";

export default function InviteMemberModal({
  open,
  setOpen,
  teamSlug,
  onSuccess
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  teamSlug: string;
  onSuccess?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'MEMBER'>('MEMBER');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`/api/teams/${teamSlug}/members`, {
        email: email.trim(),
        role: role, // Teams only have OWNER and MEMBER
      });

      toast.success(response.data.message || 'Invitation sent successfully');
      setEmail('');
      setRole('MEMBER');
      setOpen(false);
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Error inviting member:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : "Failed to invite member";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('MEMBER');
    setOpen(false);
  };

  const title = "Invite Team Member";
  const description = "Send an invitation email to add someone to this team. They can accept or decline the invitation.";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-6 space-y-6 rounded-lg bg-white dark:bg-gray-900 shadow-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'MEMBER') => setRole(value)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              className="transition hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={loading || !email.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
            >
              {loading ? "Inviting..." : "Send Invite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}