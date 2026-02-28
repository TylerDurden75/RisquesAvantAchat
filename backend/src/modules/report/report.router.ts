/**
 * Routes API pour les rapports de risque.
 */

import { Router } from 'express';
import { reportService } from './report.service.js';
import { z } from 'zod';
import { apiError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';

const addressFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({ type: z.literal('Point'), coordinates: z.tuple([z.number(), z.number()]) }),
  properties: z.object({ label: z.string(), score: z.number().optional() }).passthrough(),
});

const reportBodySchema = z.object({
  address: addressFeatureSchema,
  coords: z.tuple([z.number(), z.number()]),
});

const router = Router();

router.post('/', async (req, res, next) => {
  const parseResult = reportBodySchema.safeParse(req.body);
  if (!parseResult.success) return next(parseResult.error);

  const { address, coords } = parseResult.data;

  try {
    const report = await reportService.generateReport(address, coords);
    res.json(report);
  } catch (err) {
    next(apiError('Erreur génération rapport', 502, 'EXTERNAL_SERVICE'));
  }
});

router.post('/pdf', async (req, res, next) => {
  const parseResult = reportBodySchema.safeParse(req.body);
  if (!parseResult.success) {
    logger.warn('Invalid report PDF request', { errors: parseResult.error.errors });
    return next(parseResult.error);
  }

  const { address, coords } = parseResult.data;
  const codeInsee = (address.properties?.citycode as string) || undefined;

  try {
    logger.info('Generating PDF report', { codeInsee, label: address.properties.label });
    const report = await reportService.generateReport(address, coords);
    const pdfBytes = await reportService.generatePdf(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="rapport-risques.pdf"');
    res.send(Buffer.from(pdfBytes));
    logger.info('PDF report generated successfully', { codeInsee, reportId: report.id });
  } catch (err) {
    logger.error('PDF generation failed', err, { codeInsee, label: address.properties.label });
    next(apiError('Erreur génération PDF', 502, 'EXTERNAL_SERVICE'));
  }
});

router.get('/:id', async (req, res, next) => {
  const report = await reportService.getReport(req.params.id);
  if (!report) return next(apiError('Rapport non trouvé', 404, 'NOT_FOUND'));
  res.json(report);
});

export default router;
