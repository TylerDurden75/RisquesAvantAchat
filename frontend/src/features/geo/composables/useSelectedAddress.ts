/**
 * Composable adresse sélectionnée — état partagé map + sidebar.
 * Gère les liens partageables (URL avec lat/lon).
 *
 * @module features/geo/composables
 */

import { ref, computed, watch, onMounted } from 'vue';
import type { AddressFeature } from '@risquesavantachat/shared-types';

const BAN_REVERSE = 'https://api-adresse.data.gouv.fr/reverse';

async function reverseGeocode(lon: number, lat: number): Promise<AddressFeature | null> {
  const url = `${BAN_REVERSE}/?lon=${lon}&lat=${lat}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = (await res.json()) as { features?: AddressFeature[] };
  return data.features?.[0] ?? null;
}

export function useSelectedAddress() {
  const selectedAddress = ref<AddressFeature | null>(null);
  const initFromUrlDone = ref(false);

  const mapCenter = computed<[number, number] | undefined>(() => {
    const addr = selectedAddress.value;
    if (!addr?.geometry?.coordinates) return undefined;
    const [lng, lat] = addr.geometry.coordinates;
    return [lng, lat];
  });

  const hasSelection = computed(() => selectedAddress.value !== null);

  const shareUrl = computed(() => {
    const addr = selectedAddress.value;
    if (!addr?.geometry?.coordinates) return typeof window !== 'undefined' ? window.location.href : '';
    const [lng, lat] = addr.geometry.coordinates;
    const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const params = new URLSearchParams({ lat: lat.toFixed(5), lon: lng.toFixed(5) });
    if (addr.properties?.label) params.set('label', addr.properties.label);
    return `${base}?${params.toString()}`;
  });

  function selectAddress(feature: AddressFeature) {
    selectedAddress.value = feature;
    import('maplibre-gl').catch(() => {});
  }

  function clearSelection() {
    selectedAddress.value = null;
  }

  function updateUrlFromAddress(addr: AddressFeature | null) {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!addr?.geometry?.coordinates) {
      url.searchParams.delete('lat');
      url.searchParams.delete('lon');
      url.searchParams.delete('label');
    } else {
      const [lng, lat] = addr.geometry.coordinates;
      url.searchParams.set('lat', lat.toFixed(5));
      url.searchParams.set('lon', lng.toFixed(5));
      if (addr.properties?.label) url.searchParams.set('label', addr.properties.label);
    }
    window.history.replaceState({}, '', url.toString());
  }

  async function copyShareLink(): Promise<boolean> {
    const url = shareUrl.value;
    if (!url) return false;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  watch(selectedAddress, updateUrlFromAddress, { flush: 'post' });

  onMounted(async () => {
    if (initFromUrlDone.value) return;
    const navEntry = performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navEntry?.type === 'reload') {
      const url = new URL(window.location.href);
      url.searchParams.delete('lat');
      url.searchParams.delete('lon');
      url.searchParams.delete('label');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lon = params.get('lon');
    if (lat && lon) {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
        initFromUrlDone.value = true;
        const feature = await reverseGeocode(lonNum, latNum);
        if (feature) selectAddress(feature);
      }
    }
  });

  return {
    selectedAddress,
    mapCenter,
    hasSelection,
    shareUrl,
    selectAddress,
    clearSelection,
    copyShareLink,
  };
}
