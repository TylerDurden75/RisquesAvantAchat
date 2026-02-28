/**
 * Logger structuré pour le monitoring et le debugging.
 *
 * @module utils/logger
 */

import { config } from '../config/env.js';

export interface LogContext {
  [key: string]: unknown;
}

/**
 * Logger structuré avec contexte.
 *
 * @example
 * logger.error('Georisques fetch failed', { codeInsee: '33000', endpoint: '/ppr' });
 */
export const logger = {
  info(message: string, context?: LogContext): void {
    const log = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };
    console.log(JSON.stringify(log));
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const log: Record<string, unknown> = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (error instanceof Error) {
      log.error = {
        name: error.name,
        message: error.message,
        stack: config.nodeEnv === 'development' ? error.stack : undefined,
      };
    } else if (error) {
      log.error = String(error);
    }

    console.error(JSON.stringify(log));
  },

  warn(message: string, context?: LogContext): void {
    const log = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context,
    };
    console.warn(JSON.stringify(log));
  },
};
