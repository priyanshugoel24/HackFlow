export interface PresenceData {
  userId: string;
  cardId?: string;
  action: 'viewing' | 'editing' | 'left';
  timestamp: Date;
}
