import type { User } from './user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupPayload extends LoginCredentials {
  full_name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface StoredSession {
  token: string;
  user?: User;
  expiresAt?: number;
}
