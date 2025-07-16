export interface NotificationData {
  type: 'mention' | 'comment' | 'assignment' | 'status_change';
  title: string;
  message: string;
  cardId?: string;
  projectId?: string;
  userId: string;
  read: boolean;
  createdAt: Date;
}
