"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function InviteMemberModal({
  open,
  setOpen,
  projectSlug,
  onSuccess,
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
  projectSlug: string;
  onSuccess?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectSlug}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("User invited successfully");
        onSuccess?.();
        setEmail("");
        setOpen(false);
      } else {
        toast.error(data.error || "Failed to invite user");
      }
    } catch {
      toast.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md p-6 space-y-6 rounded-lg bg-white dark:bg-gray-900 shadow-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Invite a Team Member</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send an invite to someone’s email address to add them to this project.
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
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
              {loading ? "Inviting..." : "Invite"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}