export enum TaskPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent'
}

export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done'
}

export interface Board {
  id: string | number;
  name: string;
  description?: string | null;
}

export interface TaskList {
  id: string | number;
  board_id: string | number;
  title: string;
  position?: number;
}

export interface TaskCard {
  id: string | number;
  list_id: string | number;
  title: string;
  description?: string | null;
  priority?: TaskPriority | string;
  status?: TaskStatus | string;
}
