export interface ActivityMetadata {
  cardId?: string;
  commentId?: string;
  memberId?: string;
  oldValue?: string;
  newValue?: string;
  fieldName?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export type ActivityType = 
  | "CARD_CREATED" 
  | "COMMENT_CREATED" 
  | "CARD_EDITED" 
  | "CARD_UPDATED" 
  | "PROJECT_CREATED" 
  | "MEMBER_JOINED" 
  | "MEMBER_REMOVED"
  | "HACKATHON_STARTED"
  | "HACKATHON_ENDED"
  | "HACKATHON_UPDATE"
  | string;
