export enum UserRole {
  Admin = 'admin',
  User = 'user'
}

export enum RecordStatus {
  Active = 'active',
  Inactive = 'inactive'
}

export interface User {
  id: string | number;
  full_name: string;
  email: string;
  role_id?: string | number | null;
  department_id?: string | number | null;
  status?: RecordStatus | string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string | number;
  name: string;
  display_name?: string;
  description?: string;
  status?: RecordStatus | string;
}
