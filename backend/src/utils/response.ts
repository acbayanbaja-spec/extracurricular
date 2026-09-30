import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: any;
}

export function sendSuccess<T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: ApiResponse['meta']
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any
): void {
  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
