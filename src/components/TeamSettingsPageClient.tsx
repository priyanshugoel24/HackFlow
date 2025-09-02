"use client";
import { useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/ui/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Users, Plus, Mail, Crown, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { TeamSettingsTeam } from '@/interfaces/TeamSettingsTeam';
import { TeamSettingsPageClientProps } from '@/interfaces/TeamSettingsPageClientProps';

export default function TeamSettingsPageClient({ team: initialTeam, teamSlug }: TeamSettingsPageClientProps) {
  const [team, setTeam] = useState<TeamSettingsTeam>(initialTeam);
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Form states
  const [teamName, setTeamName] = useState(initialTeam.name);
  const [teamDescription, setTeamDescription] = useState(initialTeam.description || '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'MEMBER'>('MEMBER');

  const fetchTeam = async () => {
    try {
      const response = await axios.get(`/api/teams/${teamSlug}`);
      setTeam(response.data);
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const handleUpdateTeam = async () => {
    if (!team || !canManageTeam()) return;

    setSaving(true);
    try {
      const response = await axios.patch(`/api/teams/${teamSlug}`, {
        name: teamName,
        description: teamDescription,
      });
      setTeam(response.data);
      toast.success('Team updated successfully');
    } catch (error: unknown) {
      console.error('Error updating team:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : 'Failed to update team';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await axios.post(`/api/teams/${teamSlug}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success('Member invited successfully');
      setInviteEmail('');
      setInviteRole('MEMBER');
      setShowInviteModal(false);
      fetchTeam(); // Refresh team data
    } catch (error: unknown) {
      console.error('Error inviting member:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : 'Failed to invite member';
      toast.error(errorMessage);
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from the team?`)) {
      return;
    }

    try {
      await axios.delete(`/api/teams/${teamSlug}/members/${userId}`);
      toast.success('Member removed successfully');
      fetchTeam(); // Refresh team data
    } catch (error: unknown) {
      console.error('Error removing member:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'error' in error.response.data
        ? String(error.response.data.error)
        : 'Failed to remove member';
      toast.error(errorMessage);
    }
  };

  const canManageTeam = () => {
    return team?.userRole === 'OWNER';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default';
      case 'ADMIN':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!canManageTeam()) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don&apos;t have permission to manage this team.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton label="Back to Team" />
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2 mt-4">
            <Settings className="h-8 w-8" />
            Team Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your team configuration and members
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Information */}
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team-description">Description</Label>
                <Textarea
                  id="team-description"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Describe your team's purpose and goals"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Team Slug</Label>
                <Input value={team.slug} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Team URL: /team/{team.slug}
                </p>
              </div>

              <Button 
                onClick={handleUpdateTeam} 
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Enter email address"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Role</Label>
                        <Select value={inviteRole} onValueChange={(value: 'MEMBER') => setInviteRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button onClick={handleInviteMember} className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {team.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Image
                        src={member.user.image || '/default-avatar.svg'}
                        alt={member.user.name || member.user.email || 'User'}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.user.name || member.user.email?.split('@')[0] || 'User'}</span>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                      
                      {/* Show remove button if user can manage and member is not owner and not themselves */}
                      {canManageTeam() && member.role !== 'OWNER' && member.user.id !== team.currentUserId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user.id, member.user.name || member.user.email?.split('@')[0] || 'User')}
                          className="text-white"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
