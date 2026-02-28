import { Router } from 'express';
import dvfRouter from './dvf.router.js';

const router = Router();
router.use('/', dvfRouter);

export default router;
