/**
 * Point d'entrée de l'API RisquesAvantAchat.
 * Le premier import charge .env depuis backend/ avant toute lecture de process.env.
 *
 * @module index
 */

import './loadEnv.js';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Vue dev mode + MapLibre
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'https://www.georisques.gouv.fr', 'https://api-adresse.data.gouv.fr', 'https://tabular-api.data.gouv.fr', 'https://api.cquest.org'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // MapLibre nécessite COEP: false
}));
app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (mobile apps, Postman, etc.) en dev uniquement
    if (!origin && config.nodeEnv === 'development') {
      return callback(null, true);
    }
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(compression());
const rateLimitMax = config.nodeEnv === 'development' ? 400 : 60;
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: rateLimitMax,
    message: { error: 'Trop de requêtes, réessayez plus tard.' },
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.use('/api/v1', apiRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`🚀 API RisquesAvantAchat écoute sur http://localhost:${config.port}`);
});
