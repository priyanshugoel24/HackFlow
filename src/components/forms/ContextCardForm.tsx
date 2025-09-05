'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createContextCardAction, updateContextCardAction } from '@/actions/form-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { ContextCardFormProps } from '@/interfaces/FormInterfaces';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? 'Updating Card...' : 'Creating Card...'}
        </>
      ) : (
        isEditing ? 'Update Context Card' : 'Create Context Card'
      )}
    </Button>
  );
}

export default function ContextCardForm({ projectId, existingCard, onSuccess }: ContextCardFormProps) {
  const isEditing = !!existingCard;
  const actionFunction = isEditing 
    ? updateContextCardAction.bind(null, existingCard!.id)
    : createContextCardAction;
  
  const [state, formAction] = useActionState(actionFunction, {});

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
        <Label htmlFor="title">Card Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="Enter card title"
          defaultValue={existingCard?.title || ''}
          required
          className="w-full"
        />
        {state.errors?.title && (
          <p className="text-sm text-red-500">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Enter card content"
          rows={6}
          defaultValue={existingCard?.content || ''}
          required
          className="w-full"
        />
        {state.errors?.content && (
          <p className="text-sm text-red-500">{state.errors.content[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select name="type" defaultValue={existingCard?.type || "TASK"}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TASK">Task</SelectItem>
              <SelectItem value="INSIGHT">Insight</SelectItem>
              <SelectItem value="DECISION">Decision</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select name="visibility" defaultValue={existingCard?.visibility || "PRIVATE"}>
            <SelectTrigger>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={existingCard?.status || "ACTIVE"}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="why">Why (Optional)</Label>
        <Textarea
          id="why"
          name="why"
          placeholder="Why is this important?"
          rows={3}
          defaultValue={existingCard?.why || ''}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issues">Issues (Optional)</Label>
        <Textarea
          id="issues"
          name="issues"
          placeholder="Any issues or concerns?"
          rows={3}
          defaultValue={existingCard?.issues || ''}
          className="w-full"
        />
      </div>

      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="attachments">Attachments (Optional)</Label>
          <Input
            id="attachments"
            name="attachments"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.json,.md,.csv"
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Max 10MB per file. Supported: images, PDFs, text files
          </p>
        </div>
      )}

      {isEditing && existingCard?.attachments && existingCard.attachments.length > 0 && (
        <div className="space-y-2">
          <Label>Current Attachments</Label>
          <div className="space-y-1">
            {existingCard.attachments.map((attachment, index) => (
              <div key={index} className="text-sm text-blue-600 hover:text-blue-800">
                <a href={attachment} target="_blank" rel="noopener noreferrer">
                  {attachment.split('/').pop()}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <SubmitButton isEditing={isEditing} />
      
      {state.message && !state.success && (
        <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {state.message}
        </div>
      )}
    </form>
  );
}
