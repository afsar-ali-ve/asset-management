import type { Request } from 'express';

export interface JwtPayload {
  id: string | number;
  email?: string;
  role?: string;
  role_id?: string | number;
  full_name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface SignupRequestDto extends LoginRequestDto {
  full_name?: string;
  role_id?: string | number;
}

export interface AuthResponseDto {
  token: string;
  user: UserSession;
}

export interface UserSession {
  id: string | number;
  email: string;
  full_name?: string;
  role?: string;
}
