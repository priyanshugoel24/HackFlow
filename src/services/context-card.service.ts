import axios from 'axios';
import { ContextCard } from '@prisma/client';

export class ContextCardService {
  static async getContextCards(projectId?: string) {
    const url = projectId ? `/api/context-cards?projectId=${projectId}` : '/api/context-cards';
    const response = await axios.get(url);
    return response.data;
  }

  static async createContextCard(data: Partial<ContextCard>) {
    const response = await axios.post('/api/context-cards', data);
    return response.data;
  }

  static async updateContextCard(id: string, data: Partial<ContextCard>) {
    const response = await axios.patch(`/api/context-cards/${id}`, data);
    return response.data;
  }

  static async deleteContextCard(id: string) {
    const response = await axios.delete(`/api/context-cards/${id}`);
    return response.data;
  }

  static async getContextCard(id: string) {
    const response = await axios.get(`/api/context-cards/${id}`);
    return response.data;
  }

  static async addComment(cardId: string, content: string) {
    const response = await axios.post(`/api/context-cards/${cardId}/comments`, { content });
    return response.data;
  }

  static async getComments(cardId: string) {
    const response = await axios.get(`/api/context-cards/${cardId}/comments`);
    return response.data;
  }
}
