/**
 * API Rapports — téléchargement PDF.
 *
 * @module infrastructure/api/report
 */

import type { AddressFeature } from '@risquesavantachat/shared-types';
import { apiUrl, API_PREFIX } from '../http/client.js';

export async function downloadReportPdf(address: AddressFeature): Promise<void> {
  const [lng, lat] = address.geometry.coordinates;
  const res = await fetch(apiUrl(`${API_PREFIX}/report/pdf`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, coords: [lng, lat] }),
  });
  if (!res.ok) throw new Error(`Erreur rapport: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rapport-risques.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
