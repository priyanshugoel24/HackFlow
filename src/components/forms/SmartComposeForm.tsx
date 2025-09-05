'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createCardWithAIAction } from '@/actions/form-actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { SmartComposeFormProps } from '@/interfaces/FormInterfaces';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating with AI...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Card with AI
        </>
      )}
    </Button>
  );
}

export default function SmartComposeForm({ projectId, onSuccess }: SmartComposeFormProps) {
  const [state, formAction] = useActionState(createCardWithAIAction, {});

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
      <input type="hidden" name="projectId" value={projectId} />
      
      <div className="space-y-2">
        <Label htmlFor="input">Describe the card you want to create</Label>
        <Textarea
          id="input"
          name="input"
          placeholder="Example: Create a public INSIGHT card titled 'Remote Collaboration' that discusses async workflows and best practices for distributed teams."
          rows={6}
          required
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          Be specific about the type (TASK, INSIGHT, DECISION), visibility (PUBLIC, PRIVATE), and content you want.
        </p>
        {state.errors?.input && (
          <p className="text-sm text-red-500">{state.errors.input[0]}</p>
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
