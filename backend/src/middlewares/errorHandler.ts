import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[CNHS Server Error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 'Validation failed for request parameters.', 422, formatted);
    return;
  }

  // Handle unique constraint violation
  if (err.message && (err.message.includes('UNIQUE constraint failed') || err.message.includes('duplicate key'))) {
    sendError(res, 'A record with these unique details already exists.', 409);
    return;
  }

  // Never expose credentials, database internals or raw stack traces to the client
  sendError(res, 'An unexpected server error occurred. Please try again later.', 500);
}
