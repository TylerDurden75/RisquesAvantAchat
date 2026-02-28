/**
 * Adapter BAN — Base Adresse Nationale (géocodage).
 *
 * @module adapters/ban
 * @see https://api-adresse.data.gouv.fr/
 */

const SEARCH_URL = 'https://api-adresse.data.gouv.fr/search';

export interface BanFeature {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: Record<string, unknown>;
}

export interface BanSearchResponse {
  features?: BanFeature[];
}

export const banAdapter = {
  async search(query: string, limit = 10): Promise<BanFeature[]> {
    const url = new URL(SEARCH_URL);
    url.searchParams.set('q', query.trim());
    url.searchParams.set('limit', String(Math.min(limit, 20)));

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'RisquesAvantAchat/1.0',
      },
    });

    if (!res.ok) throw new Error(`BAN API error: ${res.status}`);
    const data = (await res.json()) as BanSearchResponse;
    return data.features ?? [];
  },
};
