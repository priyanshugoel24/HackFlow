import { User, Comment } from "@prisma/client";

export interface CommentWithRelations extends Comment {
  author: User;
  parent?: Comment;
  children?: Comment[];
}
