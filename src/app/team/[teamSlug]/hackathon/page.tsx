'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import OnlineUsers from '@/components/OnlineUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Target, 
  Send,
  Trophy,
  Zap,
  StopCircle,
  Settings
} from 'lucide-react';
import { ContextCardWithRelations } from '@/types';
import { toast } from 'sonner';

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  hackathonModeEnabled: boolean;
  hackathonDeadline?: string;
  userRole?: string;
  members: TeamMember[];
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
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

interface HackathonUpdate {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
}

export default function TeamHackathonRoom() {
  const { teamSlug } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [cards, setCards] = useState<ContextCardWithRelations[]>([]);
  const [updates, setUpdates] = useState<HackathonUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [hackathonEnded, setHackathonEnded] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [endingHackathon, setEndingHackathon] = useState(false);

  useEffect(() => {
    fetchTeamData();
  }, [teamSlug]);

  useEffect(() => {
    if (team?.hackathonDeadline) {
      const timer = setInterval(() => {
        const deadline = new Date(team.hackathonDeadline!);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();

        if (diff <= 0) {
          setHackathonEnded(true);
          setTimeLeft(null);
          clearInterval(timer);
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          setTimeLeft({ days, hours, minutes, seconds });
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [team?.hackathonDeadline]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      
      // Fetch team details
      const teamResponse = await fetch(`/api/teams/${teamSlug}`);
      if (!teamResponse.ok) throw new Error('Failed to fetch team');
      const teamData = await teamResponse.json();
      
      if (!teamData.hackathonModeEnabled) {
        // Show placeholder instead of redirecting
        setTeam(teamData);
        setLoading(false);
        return;
      }
      
      setTeam(teamData);

      // Fetch active task cards from all team projects
      const cardsResponse = await fetch(`/api/teams/${teamSlug}/hackathon-cards`);
      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json();
        setCards(cardsData.cards || []);
      }

      // Fetch hackathon updates
      const updatesResponse = await fetch(`/api/teams/${teamSlug}/hackathon-updates`);
      if (updatesResponse.ok) {
        const updatesData = await updatesResponse.json();
        setUpdates(updatesData.updates || []);
      }

    } catch (error) {
      console.error('Error fetching hackathon data:', error);
      toast.error('Failed to load hackathon room');
    } finally {
      setLoading(false);
    }
  };

  const submitUpdate = async () => {
    if (!newUpdate.trim() || submittingUpdate) return;

    try {
      setSubmittingUpdate(true);
      const response = await fetch(`/api/teams/${teamSlug}/hackathon-updates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newUpdate.trim(),
        }),
      });

      if (response.ok) {
        setNewUpdate('');
        fetchTeamData(); // Refresh updates
        toast.success('Update posted!');
      } else {
        throw new Error('Failed to post update');
      }
    } catch (error) {
      console.error('Error posting update:', error);
      toast.error('Failed to post update');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const endHackathon = async () => {
    if (!team || endingHackathon) return;
    
    if (!confirm('Are you sure you want to end the hackathon? This will disable hackathon mode for the team.')) {
      return;
    }

    try {
      setEndingHackathon(true);
      const response = await fetch(`/api/teams/${teamSlug}/hackathon`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hackathonModeEnabled: false,
          hackathonDeadline: null,
        }),
      });

      if (response.ok) {
        toast.success('Hackathon ended successfully!');
        fetchTeamData(); // Refresh to show placeholder
      } else {
        throw new Error('Failed to end hackathon');
      }
    } catch (error) {
      console.error('Error ending hackathon:', error);
      toast.error('Failed to end hackathon');
    } finally {
      setEndingHackathon(false);
    }
  };

  const exitHackathon = () => {
    router.push(`/team/${teamSlug}`);
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

  // Show placeholder if hackathon mode is not enabled
  if (!team.hackathonModeEnabled) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exitHackathon}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Team
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    {team.name} - Hackathon Mode
                  </h1>
                </div>
              </div>
              {(team.userRole === 'OWNER' || team.userRole === 'ADMIN') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/team/${teamSlug}/settings`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Enable Hackathon
                </Button>
              )}
            </div>
          </div>

          {/* Placeholder Content */}
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-12 h-12 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">No Hackathon in Progress</h2>
              <p className="text-muted-foreground mb-6">
                There's currently no active hackathon for this team. Team owners and admins can start a hackathon from the team settings.
              </p>
              {(team.userRole === 'OWNER' || team.userRole === 'ADMIN') ? (
                <Button onClick={() => router.push(`/team/${teamSlug}/settings`)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Start Hackathon
                </Button>
              ) : (
                <Button variant="outline" onClick={exitHackathon}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Team
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedCards = cards.filter(card => card.status === 'CLOSED');
  const progressPercentage = cards.length > 0 ? (completedCards.length / cards.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={exitHackathon}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit Hackathon
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  {team.name} - Hackathon Mode
                </h1>
                <p className="text-muted-foreground mt-1">
                  Team-wide hackathon with {team.projects.length} projects
                </p>
              </div>
            </div>
            {(team.userRole === 'OWNER' || team.userRole === 'ADMIN') && !hackathonEnded && (
              <Button
                variant="destructive"
                size="sm"
                onClick={endHackathon}
                disabled={endingHackathon}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                {endingHackathon ? 'Ending...' : 'End Hackathon'}
              </Button>
            )}
          </div>

          {/* Countdown Timer */}
          {hackathonEnded ? (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-6 text-center">
              <Trophy className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-2">Hackathon Ended!</h2>
              <p className="text-red-600 dark:text-red-400">Great work everyone! Time to showcase your progress.</p>
            </div>
          ) : timeLeft && (
            <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg p-6">
              <div className="flex items-center justify-center gap-6 text-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">{timeLeft.days}</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Days</div>
                  </div>
                  <div className="text-orange-400">:</div>
                  <div>
                    <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">{timeLeft.hours}</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Hours</div>
                  </div>
                  <div className="text-orange-400">:</div>
                  <div>
                    <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">{timeLeft.minutes}</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Minutes</div>
                  </div>
                  <div className="text-orange-400">:</div>
                  <div>
                    <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">{timeLeft.seconds}</div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">Seconds</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Team Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Tasks Completed Across All Projects</span>
                    <span>{completedCards.length}/{cards.length}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</span>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Tasks from all projects */}
            <Card>
              <CardHeader>
                <CardTitle>Active Tasks (All Team Projects)</CardTitle>
              </CardHeader>
              <CardContent>
                {cards.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active tasks found across team projects
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <div
                        key={card.id}
                        className={`p-4 border rounded-lg transition-colors ${
                          card.status === 'CLOSED'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                            : 'bg-background border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${card.status === 'CLOSED' ? 'line-through text-muted-foreground' : ''}`}>
                                {card.title}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {card.project.name}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {card.content}
                            </p>
                            {card.assignedTo && (
                              <div className="flex items-center gap-2 mt-2">
                                <img
                                  src={card.assignedTo.image || '/default-avatar.png'}
                                  alt={card.assignedTo.name || 'User'}
                                  className="w-5 h-5 rounded-full"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {card.assignedTo.name || card.assignedTo.email?.split('@')[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge variant={card.status === 'CLOSED' ? 'default' : 'secondary'}>
                            {card.status === 'CLOSED' ? 'Done' : 'In Progress'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({team.members.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.members.map((member) => (
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
                </div>
              </CardContent>
            </Card>

            {/* Online Users */}
            <Card>
              <CardHeader>
                <CardTitle>Online Now</CardTitle>
              </CardHeader>
              <CardContent>
                <OnlineUsers />
              </CardContent>
            </Card>

            {/* Quick Updates */}
            <Card>
              <CardHeader>
                <CardTitle>Team Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add Update */}
                  <div className="space-y-2">
                    <textarea
                      value={newUpdate}
                      onChange={(e) => setNewUpdate(e.target.value)}
                      placeholder="Share a quick update with your team..."
                      className="w-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                      rows={3}
                      maxLength={280}
                    />
                    <Button
                      size="sm"
                      onClick={submitUpdate}
                      disabled={!newUpdate.trim() || submittingUpdate}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submittingUpdate ? 'Posting...' : 'Post Update'}
                    </Button>
                  </div>

                  {/* Updates List */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {updates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No updates yet. Be the first to share!
                      </p>
                    ) : (
                      updates.map((update) => (
                        <div key={update.id} className="bg-muted/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={update.user.image || '/default-avatar.png'}
                              alt={update.user.name || 'User'}
                              className="w-5 h-5 rounded-full"
                            />
                            <span className="text-xs font-medium">{update.user.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{update.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
