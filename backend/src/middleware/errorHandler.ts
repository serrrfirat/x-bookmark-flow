import type { Request, Response, NextFunction } from 'express';
import type { ErrorResponse } from '../../../shared/src/types';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Unhandled error:', err);

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'An unexpected error occurred',
    },
  };

  res.status(500).json(errorResponse);
}
