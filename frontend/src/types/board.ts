import type { ApiId } from './api';
import type { User } from './user';

export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent'
}

export interface Board {
  id: ApiId;
  name: string;
  description?: string | null;
  owner_id?: ApiId;
}

export interface List {
  id: ApiId;
  board_id: ApiId;
  title: string;
  position?: number;
}

export interface Card {
  id: ApiId;
  list_id: ApiId;
  title: string;
  description?: string | null;
  priority?: TaskPriority | string;
  position?: number;
  assignee?: User | null;
}

export interface Comment {
  id: ApiId;
  card_id: ApiId;
  body: string;
  user?: User;
  created_at?: string;
}
