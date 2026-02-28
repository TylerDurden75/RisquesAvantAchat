/**
 * Middleware de gestion d'erreurs — format de réponse standardisé.
 *
 * @module middleware/errorHandler
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

/** Format standard des erreurs API */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export function apiError(message: string, statusCode = 500, code?: string): ApiError {
  const err = new Error(message) as ApiError;
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Paramètres invalides',
      code: 'VALIDATION_ERROR',
      details: err.flatten().fieldErrors,
    } satisfies ErrorResponse);
    return;
  }

  // Erreur API custom
  if (err instanceof Error && 'statusCode' in err) {
    const apiErr = err as ApiError;
    res.status(apiErr.statusCode ?? 500).json({
      error: apiErr.message,
      code: apiErr.code,
    } satisfies ErrorResponse);
    return;
  }

  // Erreur générique
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    code: 'INTERNAL_ERROR',
  } satisfies ErrorResponse);
}
