'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ContextCardModal,
  CreateTeamModal,
  ProjectModal,
  SmartComposeModal,
  InviteMemberModal
} from '@/components/modals';
import {
  ContextCardForm,
  TeamForm,
  ProjectForm,
  SmartComposeForm,
  CommentForm,
  InvitationForm
} from '@/components/forms';
import { Plus, Sparkles, Users, MessageSquare, UserPlus } from 'lucide-react';

export default function ServerActionsDemo() {
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [smartComposeOpen, setSmartComposeOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const demoProjectId = 'demo-project';
  const demoTeamSlug = 'demo-team';
  const demoCardId = 'demo-card';

  const handleSuccess = (action: string) => {
    console.log(`${action} completed successfully!`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Server Actions Demo</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Interactive demonstration of Next.js Server Actions implementation
        </p>
      </div>

      <Tabs defaultValue="modals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="modals">Modal Components</TabsTrigger>
          <TabsTrigger value="forms">Standalone Forms</TabsTrigger>
          <TabsTrigger value="actions">Direct Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="modals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Modal Components with Server Actions</CardTitle>
              <CardDescription>
                These modals use the new Server Action forms for better performance and UX.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => setContextModalOpen(true)}
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <Plus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Context Card</div>
                  <div className="text-sm text-gray-500">Create new cards</div>
                </div>
              </Button>

              <Button
                onClick={() => setSmartComposeOpen(true)}
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <Sparkles className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Smart Compose</div>
                  <div className="text-sm text-gray-500">AI-powered creation</div>
                </div>
              </Button>

              <Button
                onClick={() => setProjectModalOpen(true)}
                className="flex items-center gap-2 h-20"
                variant="outline"
              >
                <Plus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Project</div>
                  <div className="text-sm text-gray-500">Create projects</div>
                </div>
              </Button>

              <CreateTeamModal onTeamCreated={() => handleSuccess('Team creation')} />

              <InviteMemberModal 
                teamSlug={demoTeamSlug} 
                onInviteSent={() => handleSuccess('Invitation sent')} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Context Card Form
                </CardTitle>
                <CardDescription>
                  Create context cards with Server Actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContextCardForm 
                  projectId={demoProjectId}
                  onSuccess={() => handleSuccess('Context card creation')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Smart Compose Form
                </CardTitle>
                <CardDescription>
                  AI-powered card generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SmartComposeForm 
                  projectId={demoProjectId}
                  onSuccess={() => handleSuccess('AI card creation')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Form
                </CardTitle>
                <CardDescription>
                  Create new teams
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TeamForm onSuccess={() => handleSuccess('Team creation')} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Project Form
                </CardTitle>
                <CardDescription>
                  Create new projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectForm 
                  teamId={demoTeamSlug}
                  onSuccess={() => handleSuccess('Project creation')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comment Form
                </CardTitle>
                <CardDescription>
                  Add comments to cards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommentForm 
                  cardId={demoCardId}
                  onSuccess={() => handleSuccess('Comment addition')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invitation Form
                </CardTitle>
                <CardDescription>
                  Invite team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InvitationForm 
                  teamSlug={demoTeamSlug}
                  onSuccess={() => handleSuccess('Invitation sent')}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Direct Server Action Usage</CardTitle>
              <CardDescription>
                Examples of how to use Server Actions directly in your code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Import Server Actions</h3>
                <code className="text-sm">
                  {`import { createContextCard, createTeam, createProject } from '@/actions/card-actions';`}
                </code>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Use in Server Components</h3>
                <pre className="text-sm whitespace-pre-wrap">
{`// In a server component
const formData = new FormData();
formData.append('title', 'My Card');
formData.append('content', 'Card content');
formData.append('projectId', 'project-123');

const result = await createContextCard(formData);
if (result.success) {
  console.log('Card created:', result.card);
}`}
                </pre>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Use with useActionState</h3>
                <pre className="text-sm whitespace-pre-wrap">
{`// In a client component
const [state, formAction] = useActionState(createContextCardAction, {});

return (
  <form action={formAction}>
    <input name="title" required />
    <button type="submit">Create Card</button>
  </form>
);`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ContextCardModal
        open={contextModalOpen}
        setOpen={setContextModalOpen}
        projectSlug={demoProjectId}
        onSuccess={() => handleSuccess('Context card modal')}
      />

      <SmartComposeModal
        open={smartComposeOpen}
        setOpen={setSmartComposeOpen}
        projectSlug={demoProjectId}
        onSuccess={() => handleSuccess('Smart compose modal')}
      />

      <ProjectModal
        open={projectModalOpen}
        setOpen={setProjectModalOpen}
        teamId={demoTeamSlug}
        onSuccess={() => handleSuccess('Project modal')}
      />
    </div>
  );
}
