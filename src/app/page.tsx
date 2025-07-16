"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoginPage from "@/components/LoginPage";
import PendingInvitations from "@/components/PendingInvitations";
import { TeamWithRelations } from "@/interfaces/TeamWithRelations";
import { CreateTeamData } from "@/interfaces/CreateTeamData";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, FolderOpen } from "lucide-react";
import axios from "axios";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTeamData>({
    name: "",
    slug: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch teams when user is authenticated
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      fetchTeams();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      const response = await axios.get("/api/teams");
      
      setTeams(response.data || []); // Ensure we always set an array
    } catch (error: any) {
      // Handle different error scenarios gracefully
      if (error.response?.status === 401) {
        console.error("Unauthorized - please log in again");
        setError("Please log in again to access your teams");
      } else if (error.response?.status === 404) {
        // User not found, but treat as no teams available
        console.warn("User not found, treating as no teams available");
        setTeams([]);
      } else {
        console.error(`Failed to fetch teams: ${error.response?.status}`);
        setError("Unable to load teams. Please try again.");
      }
      setTeams([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null); // Clear any fetch errors

    try {
      const response = await axios.post("/api/teams", formData);

      setCreateModalOpen(false);
      setFormData({ name: "", slug: "", description: "" });
      fetchTeams(); // Refresh teams list
    } catch (error: any) {
      setError(error.response?.data?.error || "Failed to create team");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSlugChange = (name: string) => {
    // Auto-generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return slug;
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: handleSlugChange(name)
    }));
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-zinc-900 dark:to-zinc-800">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Teams</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Collaborate and manage projects across your teams
            </p>
          </div>
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateTeam}>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Create a new team to collaborate with others on projects.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter team name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="team-slug"
                      required
                      pattern="^[a-z0-9-]+$"
                      title="Only lowercase letters, numbers, and hyphens allowed"
                    />
                    <p className="text-xs text-gray-500">
                      Used in URLs. Only lowercase letters, numbers, and hyphens.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of your team"
                      rows={3}
                    />
                  </div>
                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {error}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={createLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create Team"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-red-500"></div>
              <p className="text-red-700 dark:text-red-300 font-medium">Error</p>
            </div>
            <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
              onClick={() => {
                setError(null);
                fetchTeams();
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Pending Invitations */}
        <div className="mb-8">
          <PendingInvitations onInvitationAccepted={fetchTeams} />
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No teams yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You&apos;re not part of any team yet. Create one to get started.
            </p>
            <Button onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Team
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{team.name}</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {team.role}
                    </span>
                  </CardTitle>
                  {team.description && (
                    <CardDescription className="line-clamp-2">
                      {team.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{team._count?.members || 0} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FolderOpen className="h-4 w-4" />
                      <span>{team._count?.projects || 0} projects</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => router.push(`/team/${team.slug}`)}
                  >
                    View Team
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}