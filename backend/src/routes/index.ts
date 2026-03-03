/**
 * Assemblage des routes API par module.
 */

import { Router } from 'express';
import { geocodingRouter } from '../modules/geocoding/index.js';
import { risksRouter } from '../modules/risks/index.js';
import { reportRouter } from '../modules/report/index.js';
import dvfRouter from '../modules/dvf/index.js';
import { geoRouter } from '../modules/geo/index.js';
import { cadastreRouter } from '../modules/cadastre/index.js';

const router = Router();

router.use('/addresses', geocodingRouter);
router.use('/risks', risksRouter);
router.use('/report', reportRouter);
router.use('/dvf', dvfRouter);
router.use('/geo', geoRouter);
router.use('/cadastre', cadastreRouter);

export default router;
