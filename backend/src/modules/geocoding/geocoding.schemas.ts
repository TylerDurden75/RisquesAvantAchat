/**
 * Schémas Zod pour validation des routes géocodage.
 */

import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Paramètre q requis').max(500),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((v) => {
      const n = parseInt(v, 10);
      return isNaN(n) ? 10 : Math.min(Math.max(n, 1), 20);
    }),
});
