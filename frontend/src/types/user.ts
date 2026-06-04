import type { ApiId } from './api';

export enum UserRole {
  Admin = 'admin',
  User = 'user'
}

export enum RecordStatus {
  Active = 'active',
  Inactive = 'inactive'
}

export interface Role {
  id: ApiId;
  name: string;
  display_name?: string;
  description?: string;
  status?: RecordStatus | string;
}

export interface Department {
  id: ApiId;
  name: string;
  status?: RecordStatus | string;
}

export interface User {
  id: ApiId;
  full_name: string;
  email: string;
  role?: string;
  role_id?: ApiId | null;
  department?: string | null;
  department_id?: ApiId | null;
  status?: RecordStatus | string;
  profile_image?: string | null;
}
