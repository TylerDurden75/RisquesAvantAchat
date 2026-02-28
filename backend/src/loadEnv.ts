/**
 * Charge les variables d'environnement depuis backend/.env avant tout autre module.
 * Doit être le premier import de index.ts.
 *
 * @module loadEnv
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
