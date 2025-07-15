'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import OnlineUsers from '@/components/OnlineUsers';
import ProjectModal from '@/components/ProjectModal';
import TeamStandupDigest from '@/components/TeamStandupDigest';
import InviteTeamMemberModal from '@/components/InviteTeamMemberModal';
import AssignedCards from '@/components/AssignedCards';
import FocusMode from '@/components/FocusMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, ExternalLink, Calendar, Settings, UserPlus, BarChart3, Target } from 'lucide-react';
import { ContextCardWithRelations } from '@/types';

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hackathonDeadline?: string;
  hackathonModeEnabled: boolean;
  projects: Project[];
  members: TeamMember[];
  userRole?: string;
  _count: {
    members: number;
    projects: number;
  };
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  link?: string;
  createdAt: string;
  lastActivityAt: string;
  tags: string[];
  _count: {
    contextCards: number;
  };
}

interface TeamMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export default function TeamPage() {
  const { teamSlug } = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showHackathonModal, setShowHackathonModal] = useState(false);
  const [projectStats, setProjectStats] = useState<Record<string, { completed: number; total: number }>>({});
  
  // Focus Mode state
  const [selectedCards, setSelectedCards] = useState<ContextCardWithRelations[]>([]);
  const [showFocusMode, setShowFocusMode] = useState(false);

  // Hackathon state
  const [hackathonDeadline, setHackathonDeadline] = useState('');

  useEffect(() => {
    fetchTeam();
  }, [teamSlug]);

  useEffect(() => {
    if (team?.projects) {
      fetchProjectStats();
    }
  }, [team]);

  const fetchTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamSlug}`);
      if (response.ok) {
        const teamData = await response.json();
        setTeam(teamData);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async () => {
    if (!team?.projects) return;
    
    const stats: Record<string, { completed: number; total: number }> = {};
    
    for (const project of team.projects) {
      try {
        const response = await fetch(`/api/context-cards?projectId=${project.id}&type=TASK`);
        if (response.ok) {
          const data = await response.json();
          const tasks = data.cards || [];
          const completed = tasks.filter((task: any) => task.status === 'CLOSED').length;
          stats[project.id] = { completed, total: tasks.length };
        }
      } catch (error) {
        console.error(`Error fetching stats for project ${project.id}:`, error);
        stats[project.id] = { completed: 0, total: 0 };
      }
    }
    
    setProjectStats(stats);
  };

  const handleProjectClick = (project: Project) => {
    router.push(`/team/${teamSlug}/project/${project.slug}`);
  };

  const handleToggleFocusCard = (card: ContextCardWithRelations) => {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      if (isSelected) {
        return prev.filter(c => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  };

  const handleEnterFocusMode = () => {
    if (selectedCards.length > 0) {
      setShowFocusMode(true);
    }
  };

  const handleFocusModeClose = () => {
    setShowFocusMode(false);
    // Optionally clear selected cards after focus session
    setSelectedCards([]);
  };

  const handleStartHackathon = async () => {
    if (!hackathonDeadline) {
      alert('Please select a deadline for the hackathon');
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamSlug}/hackathon`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hackathonModeEnabled: true,
          hackathonDeadline: hackathonDeadline,
        }),
      });

      if (response.ok) {
        setShowHackathonModal(false);
        setHackathonDeadline('');
        fetchTeam(); // Refresh team data
        // Navigate to hackathon room
        router.push(`/team/${teamSlug}/hackathon`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start hackathon');
      }
    } catch (error) {
      console.error('Error starting hackathon:', error);
      alert('Failed to start hackathon');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Team not found</h1>
            <p className="text-muted-foreground">The team you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Team Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
              {team.description && (
                <p className="text-muted-foreground mt-2">{team.description}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {team._count.members} members • {team._count.projects} projects
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/team/${teamSlug}/analytics`)}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                {(team.userRole === 'OWNER' || team.userRole === 'ADMIN') && (
                  <>
                    {!team.hackathonModeEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHackathonModal(true)}
                        className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950"
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Start Hackathon
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInviteModal(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite Member
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/team/${teamSlug}/settings`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Team Hackathon Section */}
        {team.hackathonModeEnabled && (
          <div className="mb-8">
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-orange-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                          Hackathon Mode Active
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                          {team.hackathonDeadline && (
                            <>Deadline: {new Date(team.hackathonDeadline).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/team/${teamSlug}/hackathon`)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Join Hackathon Room
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assigned Cards Section - Moved to Top */}
        <div className="mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">My Assigned Cards</h2>
              <div className="flex items-center gap-3">
                {selectedCards.length > 0 && (
                  <Button 
                    onClick={handleEnterFocusMode}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Enter Focus Mode ({selectedCards.length})
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/team/${teamSlug}/assigned-cards`)}
                >
                  View All
                </Button>
              </div>
            </div>
            <AssignedCards 
              teamId={team.id} 
              currentUserOnly={true}
              onToggleFocusCard={handleToggleFocusCard}
              selectedCardIds={selectedCards.map(c => c.id)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-foreground">Projects</h2>
                <Button onClick={() => setShowProjectModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </div>
              
              {team.projects.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground mb-4">No projects yet</p>
                  <Button onClick={() => setShowProjectModal(true)}>
                    Create your first project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {team.projects.map((project) => {
                    const stats = projectStats[project.id] || { completed: 0, total: 0 };
                    const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                    
                    return (
                      <Card 
                        key={project.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handleProjectClick(project)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg font-semibold truncate">
                              {project.name}
                            </CardTitle>
                            {project.link && (
                              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                            )}
                          </div>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Task Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Tasks</span>
                              <span className="text-muted-foreground">
                                {stats.completed}/{stats.total}
                              </span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                          </div>

                          {/* Tags */}
                          {project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {project.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{project.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Standup Digest */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Daily Standup</h3>
              <TeamStandupDigest teamSlug={teamSlug as string} />
            </div>

            {/* Online Users */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Online Now</h3>
              <OnlineUsers />
            </div>
            
            {/* Team Members */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Team Members</h3>
              <div className="space-y-3">
                {team.members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <img
                      src={member.user.image || '/default-avatar.png'}
                      alt={member.user.name || member.user.email || 'User'}
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.user.name || member.user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
                {team.members.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    +{team.members.length - 5} more members
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectModal
        open={showProjectModal}
        setOpen={setShowProjectModal}
        onSuccess={fetchTeam}
        teamId={team.id}
      />

      <InviteTeamMemberModal
        open={showInviteModal}
        setOpen={setShowInviteModal}
        teamSlug={teamSlug as string}
        onSuccess={fetchTeam}
      />

      {/* Start Hackathon Modal */}
      <Dialog open={showHackathonModal} onOpenChange={setShowHackathonModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Start Team Hackathon
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Start a hackathon for your team. All team members will be able to join and track progress across all team projects.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="hackathon-deadline">Hackathon Deadline</Label>
              <Input
                id="hackathon-deadline"
                type="datetime-local"
                value={hackathonDeadline}
                onChange={(e) => setHackathonDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-xs text-muted-foreground">
                Set when the hackathon should end
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowHackathonModal(false);
                  setHackathonDeadline('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartHackathon}
                disabled={!hackathonDeadline}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Target className="h-4 w-4 mr-2" />
                Start Hackathon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FocusMode
        cards={selectedCards}
        open={showFocusMode}
        onClose={handleFocusModeClose}
      />
    </div>
  );
}
