/**
 * Contexte partagé pour la sélection d'adresse.
 * Permet à HomePage d'accéder aux données sans prop drilling via le router.
 *
 * @module app/geoContext
 */

import type { InjectionKey, Ref } from 'vue';
import type { AddressFeature } from '@risquesavantachat/shared-types';

export interface GeoContext {
  selectedAddress: Ref<AddressFeature | null>;
  mapCenter: Ref<[number, number] | undefined>;
  selectAddress: (feature: AddressFeature) => void;
  copyShareLink: () => Promise<boolean>;
}

export const GEO_CONTEXT_KEY: InjectionKey<GeoContext> = Symbol('geo-context');
