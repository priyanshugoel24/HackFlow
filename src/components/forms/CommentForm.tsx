'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addCommentAction } from '@/actions/form-actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { CommentFormProps } from '@/interfaces/FormInterfaces';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Posting...
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          Post Comment
        </>
      )}
    </Button>
  );
}

export default function CommentForm({ 
  cardId, 
  parentId, 
  placeholder = "Add a comment...", 
  onSuccess,
  autoFocus = false 
}: CommentFormProps) {
  const [state, formAction] = useActionState(addCommentAction, {});
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
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="cardId" value={cardId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      
      <Textarea
        name="content"
        placeholder={placeholder}
        rows={3}
        required
        autoFocus={autoFocus}
        className="w-full resize-none"
      />
      
      <div className="flex justify-end">
        <SubmitButton />
      </div>
      
      {state.message && !state.success && (
        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {state.message}
        </div>
      )}
    </form>
  );
}
