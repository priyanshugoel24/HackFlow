'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { sendInvitationAction } from '@/actions/form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { InvitationFormProps } from '@/interfaces/FormInterfaces';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending Invitation...
        </>
      ) : (
        <>
          <UserPlus className="mr-2 h-4 w-4" />
          Send Invitation
        </>
      )}
    </Button>
  );
}

export default function InvitationForm({ teamSlug, onSuccess }: InvitationFormProps) {
  const [state, formAction] = useActionState(sendInvitationAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onSuccess?.();
      // Reset form on success
      formRef.current?.reset();
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="teamSlug" value={teamSlug} />
      
      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter email address"
          required
          className="w-full"
        />
        {state.errors?.email && (
          <p className="text-sm text-red-500">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select name="role" defaultValue="MEMBER">
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="OWNER">Owner</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Owners can manage team settings and invite new members.
        </p>
      </div>

      <SubmitButton />
      
      {state.message && !state.success && (
        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {state.message}
        </div>
      )}
    </form>
  );
}
