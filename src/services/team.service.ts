import axios from 'axios';
import { Team } from '@prisma/client';

export class TeamService {
  static async getTeam(slug: string) {
    const response = await axios.get(`/api/teams/${slug}`);
    return response.data;
  }

  static async updateTeam(slug: string, data: Partial<Team>) {
    const response = await axios.patch(`/api/teams/${slug}`, data);
    return response.data;
  }

  static async deleteTeam(slug: string) {
    const response = await axios.delete(`/api/teams/${slug}`);
    return response.data;
  }

  static async createTeam(data: Partial<Team>) {
    const response = await axios.post('/api/teams', data);
    return response.data;
  }

  static async getTeamMembers(slug: string) {
    const response = await axios.get(`/api/teams/${slug}/members`);
    return response.data;
  }

  static async inviteMember(teamSlug: string, email: string, role: string) {
    const response = await axios.post(`/api/teams/${teamSlug}/invite`, { email, role });
    return response.data;
  }

  static async removeMember(teamSlug: string, memberId: string) {
    const response = await axios.delete(`/api/teams/${teamSlug}/members/${memberId}`);
    return response.data;
  }

  static async updateMemberRole(teamSlug: string, memberId: string, role: string) {
    const response = await axios.patch(`/api/teams/${teamSlug}/members/${memberId}`, { role });
    return response.data;
  }
}
