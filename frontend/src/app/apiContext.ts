/**
 * Contexte des clients API — DI pour testabilité.
 * Permet d'injecter des mocks dans les tests.
 *
 * @module app
 */

import type { InjectionKey } from 'vue';
import type { ApiClients } from '@core';
import {
  defaultAddressApi,
  defaultRisksApi,
  defaultDvfApi,
  defaultReportApi,
} from '@infra/api';

export const defaultApiClients: ApiClients = {
  address: defaultAddressApi,
  risks: defaultRisksApi,
  dvf: defaultDvfApi,
  report: defaultReportApi,
};

export const API_CONTEXT_KEY: InjectionKey<ApiClients> = Symbol('api-clients');
