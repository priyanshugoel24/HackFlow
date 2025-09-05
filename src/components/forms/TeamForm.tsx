'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTeamAction } from '@/actions/form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { TeamFormProps } from '@/interfaces/FormInterfaces';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Team...
        </>
      ) : (
        'Create Team'
      )}
    </Button>
  );
}

export default function TeamForm({ onSuccess }: TeamFormProps) {
  const [state, formAction] = useActionState(createTeamAction, {});

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      onSuccess?.();
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Team Name *</Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter team name"
          required
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          A unique URL will be automatically generated from the team name.
        </p>
        {state.errors?.name && (
          <p className="text-sm text-red-500">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Brief description of your team"
          rows={3}
          className="w-full"
        />
        {state.errors?.description && (
          <p className="text-sm text-red-500">{state.errors.description[0]}</p>
        )}
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
