/**
 * API — clients réseau (adapters).
 *
 * Chaque module expose une responsabilité unique (Single Responsibility).
 *
 * @module infrastructure/api
 */

export { searchAddresses } from './address.api.js';
export { getRisksNearby, getRiskZones } from './risks.api.js';
export { getDvfIndicators } from './dvf.api.js';
export { downloadReportPdf } from './report.api.js';
export {
  defaultAddressApi,
  defaultRisksApi,
  defaultDvfApi,
  defaultReportApi,
} from './clients.js';
