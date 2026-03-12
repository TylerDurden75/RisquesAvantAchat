/**
 * Interfaces des APIs — abstraction pour DI et testabilité.
 * Les composables peuvent recevoir ces implémentations en injection.
 *
 * @module core
 */

import type {
  AddressFeature,
  DvfIndicators,
  ParcelleInfo,
  RiskScoreResult,
  RiskZonesGeoJSON,
} from '@risquesavantachat/shared-types';

export interface AddressApi {
  searchAddresses(query: string, limit?: number): Promise<AddressFeature[]>;
}

export interface RisksApi {
  getRisksNearby(
    lat: number,
    lng: number,
    codeInsee?: string,
    signal?: AbortSignal,
    radiusMeters?: number
  ): Promise<RiskScoreResult>;
  getRiskZones(codeInsee: string, signal?: AbortSignal): Promise<RiskZonesGeoJSON>;
}

export interface DvfApi {
  getDvfIndicators(
    codeInsee: string,
    opts?: {
      lat?: number;
      lon?: number;
      parcelle?: ParcelleInfo | null;
      signal?: AbortSignal;
    }
  ): Promise<DvfIndicators | null>;
}

export interface ReportApi {
  downloadReportPdf(address: AddressFeature): Promise<void>;
}

export interface ApiClients {
  address: AddressApi;
  risks: RisksApi;
  dvf: DvfApi;
  report: ReportApi;
}
