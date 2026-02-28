/**
 * Implémentations par défaut des clients API — injectables pour les tests.
 *
 * @module infrastructure/api
 */

import type { AddressApi, RisksApi, DvfApi, ReportApi } from '@core';
import { searchAddresses } from './address.api.js';
import { getRisksNearby, getRiskZones } from './risks.api.js';
import { getDvfIndicators } from './dvf.api.js';
import { downloadReportPdf } from './report.api.js';

export const defaultAddressApi: AddressApi = {
  searchAddresses,
};

export const defaultRisksApi: RisksApi = {
  getRisksNearby,
  getRiskZones,
};

export const defaultDvfApi: DvfApi = {
  getDvfIndicators,
};

export const defaultReportApi: ReportApi = {
  downloadReportPdf,
};
