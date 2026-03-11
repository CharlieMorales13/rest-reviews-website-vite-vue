export interface ApiError {
  success: boolean;
  message: string;
}

export interface ValidationError extends ApiError {
  errors: Array<{
    code: string;
    minimum?: number;
    type?: string;
    inclusive?: boolean;
    message: string;
    path: string[];
  }>;
}
