/**
 * Schémas Zod pour validation des routes DVF.
 */

import { z } from 'zod';

export const indicatorsQuerySchema = z.object({
  code_insee: z.string().trim().min(1, 'code_insee requis').max(10),
  lat: z.string().optional().transform((s) => (s ? parseFloat(s) : undefined)),
  lon: z.string().optional().transform((s) => (s ? parseFloat(s) : undefined)),
  section: z.string().trim().max(10).optional(),
  numero: z.string().trim().max(10).optional(),
});
