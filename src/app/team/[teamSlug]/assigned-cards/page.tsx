'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AssignedCards from '@/components/AssignedCards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BackButton from '@/components/ui/BackButton';

interface Team {
  id: string;
  name: string;
  slug: string;
  members: any[];
}

export default function TeamAssignedCardsPage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    if (teamSlug) {
      fetchTeam();
    }
  }, [teamSlug]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Team not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <BackButton label="Back to Team" className="mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Assigned Cards - {team.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View all cards assigned to team members
        </p>
      </div>

      <Tabs defaultValue="my-cards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-cards">My Cards</TabsTrigger>
          <TabsTrigger value="team-cards">All Team Cards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-cards" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cards Assigned to Me</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignedCards teamId={team.id} currentUserOnly={true} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="team-cards" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>All Team Assigned Cards</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignedCards teamId={team.id} currentUserOnly={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
