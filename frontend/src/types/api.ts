export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  error?: string;
}

export type ApiId = string | number;

export type ApiParams = Record<string, string | number | boolean | null | undefined>;

export type ApiPayload = Record<string, unknown>;
