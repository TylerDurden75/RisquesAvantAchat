/**
 * Schémas Zod pour validation des routes risques.
 */

import { z } from 'zod';
import { DEFAULT_RADIUS_METERS, MAX_RADIUS_METERS } from './risks.constants.js';

export const nearbyQuerySchema = z.object({
  lat: z.string().pipe(z.coerce.number().min(-90).max(90)),
  lng: z.string().pipe(z.coerce.number().min(-180).max(180)),
  code_insee: z.string().trim().max(10).optional().or(z.literal('')),
  radius: z.string().optional().transform((v) => {
    const n = parseInt(v ?? String(DEFAULT_RADIUS_METERS), 10);
    return isNaN(n) || n < 0 ? DEFAULT_RADIUS_METERS : Math.min(n, MAX_RADIUS_METERS);
  }),
});

export const zonesQuerySchema = z.object({
  code_insee: z.string().trim().min(1).max(10),
});

/** Query pour l'endpoint état des risques (pré-remplissage). */
export const etatDesRisquesQuerySchema = z.object({
  code_insee: z.string().trim().min(1).max(10),
  lat: z.string().pipe(z.coerce.number().min(-90).max(90)).optional(),
  lng: z.string().pipe(z.coerce.number().min(-180).max(180)).optional(),
});

// Schémas pour validation des réponses Georisques (v1 et v2)
// v2 utilise parfois "content" au lieu de "data" et une pagination totalElements / pageNumber / pageSize

export const radonResponseSchema = z.object({
  data: z.array(z.object({
    classe_potentiel: z.string().optional(),
    classePotentiel: z.string().optional(),
  }).transform((o) => ({ classe_potentiel: o.classe_potentiel ?? o.classePotentiel ?? '' }))).optional(),
  content: z.array(z.object({
    classe_potentiel: z.string().optional(),
    classePotentiel: z.string().optional(),
  }).transform((o) => ({ classe_potentiel: o.classe_potentiel ?? o.classePotentiel ?? '' }))).optional(),
}).transform((r) => ({ data: r.data ?? r.content ?? [] }));

export const sismiciteResponseSchema = z.object({
  data: z.array(z.object({
    zone_sismicite: z.string().optional(),
    zoneSismicite: z.string().optional(),
  }).transform((o) => ({ zone_sismicite: o.zone_sismicite ?? o.zoneSismicite ?? '' }))).optional(),
  content: z.array(z.object({
    zone_sismicite: z.string().optional(),
    zoneSismicite: z.string().optional(),
  }).transform((o) => ({ zone_sismicite: o.zone_sismicite ?? o.zoneSismicite ?? '' }))).optional(),
}).transform((r) => ({ data: r.data ?? r.content ?? [] }));

export const mvtResponseSchema = z.object({
  data: z.array(z.object({
    identifiant: z.string().optional(),
    type: z.string().optional(),
    code_insee: z.string().optional(),
    fiabilite: z.string().optional(),
    libelle_alea: z.string().optional(),
    niveau_alea: z.string().optional(),
  })).optional(),
  content: z.array(z.object({
    identifiant: z.string().optional(),
    type: z.string().optional(),
    code_insee: z.string().optional(),
    libelle_alea: z.string().optional(),
  })).optional(),
  results: z.number().optional(),
  totalElements: z.number().optional(),
}).transform((r) => ({
  data: r.data ?? r.content ?? [],
  results: r.results ?? r.totalElements ?? 0,
}));

export const argilesResponseSchema = z.object({
  data: z.array(z.object({
    code_insee: z.string().optional(),
    niveau: z.string().optional(),
    libelle: z.string().optional(),
  })).optional(),
  content: z.array(z.object({
    codeExposition: z.string().optional(),
    exposition: z.string().optional(),
    code_insee: z.string().optional(),
    niveau: z.string().optional(),
    libelle: z.string().optional(),
  })).optional(),
  results: z.number().optional(),
  totalElements: z.number().optional(),
});

/** Réponse RGA v2 normalisée pour le service (level 1–3, libelle). */
export const rgaResponseSchema = argilesResponseSchema.transform((r) => {
  const items = r.data ?? r.content ?? [];
  const data = items.map((it) => {
    const code = (it as { codeExposition?: string; exposition?: string; niveau?: string; libelle?: string }).codeExposition
      ?? (it as { niveau?: string }).niveau;
    const expo = (it as { exposition?: string }).exposition ?? (it as { libelle?: string }).libelle ?? '';
    const level = code ? Math.min(3, Math.max(1, parseInt(String(code), 10) || 2)) : 2;
    return { level, libelle: expo || `Niveau ${level}/3` };
  });
  return { data };
});

export const pprItemSchema = z.object({
  id_gaspar: z.string().optional(),
  idGaspar: z.string().optional(),
  nom_ppr: z.string().optional(),
  nomPpr: z.string().optional(),
  libPpr: z.string().optional(),
  date_approbation: z.string().nullable().optional(),
  dateApprobation: z.string().nullable().optional(),
  dateModification: z.string().nullable().optional(),
  modeleProcedure: z.string().optional(),
  libBassinRisques: z.string().optional(),
  risque: z.object({
    libelle_risque: z.string().optional(),
    libelleRisque: z.string().optional(),
  }).optional(),
  etat: z.object({
    libelle_etat: z.string().optional(),
    libelleEtat: z.string().optional(),
  }).optional(),
  geom_perimetre: z.object({
    features: z.array(z.unknown()),
  }).optional(),
  geomPerimetre: z.object({
    features: z.array(z.unknown()),
  }).optional(),
  geom_zonage: z.object({
    features: z.array(z.unknown()),
  }).optional(),
  geomZonage: z.object({
    features: z.array(z.unknown()),
  }).optional(),
});

/** Réponse paginée v2 Gaspar (pprn, pprt, pprm) — format documenté Georisques. */
export const gasparPprListResponseSchema = z.object({
  totalElements: z.number().optional(),
  totalPages: z.number().optional(),
  pageNumber: z.number().optional(),
  pageSize: z.number().optional(),
  content: z.array(z.object({
    idGaspar: z.string(),
    libPpr: z.string(),
    modeleProcedure: z.string().optional(),
    libBassinRisques: z.string().optional(),
    etatRevision: z.boolean().optional(),
    supExists: z.boolean().optional(),
    zonageReglementaire: z.object({
      zoneRegExists: z.boolean().optional(),
      listTypeReg: z.array(z.object({
        code: z.string().optional(),
        libelle: z.string().optional(),
        nom: z.string().optional(),
        codeZone: z.string().optional(),
      })).optional(),
    }).optional(),
    departementPilote: z.object({
      codeDepartementPilote: z.string().optional(),
      libelleDepartementPilote: z.string().optional(),
    }).optional(),
    dateModification: z.string().nullable().optional(),
    listePprRevises: z.array(z.string()).optional(),
  })).optional(),
}).transform((r) => {
  const content = r.content ?? [];
  const data = content.map((c) => ({
    id_gaspar: c.idGaspar,
    idGaspar: c.idGaspar,
    nom_ppr: c.libPpr,
    nomPpr: c.libPpr,
    libPpr: c.libPpr,
    date_approbation: c.dateModification ?? null,
    dateApprobation: c.dateModification ?? null,
    dateModification: c.dateModification,
    modeleProcedure: c.modeleProcedure,
    libBassinRisques: c.libBassinRisques,
    risque: {
      libelle_risque: c.libBassinRisques ?? c.modeleProcedure ?? 'PPR',
      libelleRisque: c.libBassinRisques ?? c.modeleProcedure ?? 'PPR',
    },
    etat: undefined,
    geom_perimetre: undefined,
    geom_zonage: undefined,
  }));
  return { data, results: r.totalElements ?? data.length };
});

export const pprResponseSchema = z.union([
  gasparPprListResponseSchema,
  z.object({
    data: z.array(pprItemSchema).optional(),
    content: z.array(pprItemSchema).optional(),
    results: z.number().optional(),
    totalElements: z.number().optional(),
  }).transform((r) => ({
    data: r.data ?? r.content ?? [],
    results: r.results ?? r.totalElements ?? 0,
  })),
]);

/** Réponse détail d’un PPR (v2) — peut contenir les géométries (zonage ou périmètre). */
export const pprDetailResponseSchema = z.object({
  idGaspar: z.string().optional(),
  id_gaspar: z.string().optional(),
  libPpr: z.string().optional(),
  nomPpr: z.string().optional(),
  nom_ppr: z.string().optional(),
  dateModification: z.string().nullable().optional(),
  dateApprobation: z.string().nullable().optional(),
  date_approbation: z.string().nullable().optional(),
  libBassinRisques: z.string().optional(),
  modeleProcedure: z.string().optional(),
  risque: z.object({
    libelleRisque: z.string().optional(),
    libelle_risque: z.string().optional(),
  }).optional(),
  geom_zonage: z.object({ features: z.array(z.unknown()) }).optional(),
  geomZonage: z.object({ features: z.array(z.unknown()) }).optional(),
  geom_perimetre: z.object({ features: z.array(z.unknown()) }).optional(),
  geomPerimetre: z.object({ features: z.array(z.unknown()) }).optional(),
}).passthrough();

export type PprItem = z.infer<typeof pprItemSchema>;

/** Réponse v2 Atlas des Zones Inondables (AZI) — GET /api/v2/gaspar/azi */
export const aziResponseSchema = z.object({
  totalElements: z.number().optional(),
  totalPages: z.number().optional(),
  pageNumber: z.number().optional(),
  pageSize: z.number().optional(),
  content: z.array(z.object({
    uuid: z.string().optional(),
    idGaspar: z.string().optional(),
    libelle: z.string(),
    libBassinRisques: z.string().optional(),
    dateModification: z.string().nullable().optional(),
    communes: z.array(z.object({
      nom: z.string().optional(),
      codeInsee: z.string().optional(),
      aleas: z.array(z.object({
        codeGaspar: z.string().optional(),
        libelle: z.string().optional(),
      })).optional(),
    })).optional(),
  })).optional(),
}).transform((r) => {
  const content = r.content ?? [];
  return { data: content, total: r.totalElements ?? content.length };
});

/** Réponse CATNAT (arrêtés de catastrophe naturelle) — v1 ou v2. */
const catnatItemSchema = z.object({
  date_arrete: z.string().optional(),
  dateArrete: z.string().optional(),
  libelle_risque: z.string().optional(),
  libelleRisque: z.string().optional(),
  libelle_commune: z.string().optional(),
  code_insee: z.string().optional(),
}).passthrough();

export const catnatResponseSchema = z.object({
  data: z.array(catnatItemSchema).optional(),
  content: z.array(catnatItemSchema).optional(),
  results: z.number().optional(),
  totalElements: z.number().optional(),
}).transform((r) => ({
  data: r.data ?? r.content ?? [],
  count: r.results ?? r.totalElements ?? (r.data ?? r.content ?? []).length,
}));

/** Réponse générique liste (SIS, BASIAS, IC) — v2 content/totalElements ou v1 data/results. */
const listCountSchema = z.object({
  data: z.array(z.record(z.unknown())).optional(),
  content: z.array(z.record(z.unknown())).optional(),
  results: z.number().optional(),
  totalElements: z.number().optional(),
}).transform((r) => ({
  data: r.data ?? r.content ?? [],
  count: r.results ?? r.totalElements ?? (r.data ?? r.content ?? []).length,
}));

export const sisResponseSchema = listCountSchema;
export const basiasResponseSchema = listCountSchema;
export const icResponseSchema = listCountSchema;
