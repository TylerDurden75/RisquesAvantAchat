# Architecture Frontend — RisquesAvantAchat

Architecture modulaire, scalable et évolutive respectant les principes SOLID.

## Structure

```
src/
├── app/                    # Point d'entrée applicatif
│   ├── main.ts
│   ├── App.vue
│   ├── HomePage.vue
│   └── style.css
├── core/                   # Domaine partagé (Single Source of Truth)
│   └── types/              # Réexport @risquesavantachat/shared-types
├── infrastructure/         # Couche technique (Dependency Inversion)
│   ├── http/               # Client HTTP, fetchWithRetry
│   └── api/                # Clients API (address, risks, dvf, report)
├── features/               # Modules métier (Vertical Slices)
│   ├── address/            # Recherche d'adresses
│   ├── geo/                # Carte, sélection, URL partageable
│   ├── risks/              # Analyse risques, PPR, export PDF
│   └── dvf/                # Indicateurs prix immobiliers
└── shared/                 # Composants réutilisables
    └── components/         # EmptyState, etc.
```

## Principes SOLID

- **S** — Chaque module a une responsabilité unique (ex: `address.api.ts` = géocodage)
- **O** — Extensible via nouveaux features sans modifier l'existant
- **L** — Types partagés (shared-types) garantissent la cohérence
- **I** — Interfaces minimales (chaque API expose peu de méthodes ciblées)
- **D** — Les features dépendent de `@infra` et `@core`, pas des implémentations concrètes

## Alias de chemins

| Alias | Chemin | Usage |
|-------|--------|-------|
| `@/` | `src/` | Import général |
| `@core` | `src/core` | Types domaine |
| `@infra` | `src/infrastructure` | HTTP, API |
| `@features` | `src/features` | Modules métier |
| `@shared` | `src/shared` | Composants partagés |

## Injection de dépendances (DI)

Les composables acceptent des APIs injectables pour la testabilité :

```ts
// En production : utilise le context injecté ou defaultApiClients
const { results } = useAddressSearch();

// En test : injecte un mock
const mockApi = { searchAddresses: vi.fn().mockResolvedValue([]) };
const { results } = useAddressSearch('', mockApi);
```

Interfaces : `@core` expose `AddressApi`, `RisksApi`, `DvfApi`, `ReportApi`.

## Orchestration

`useReportData()` dans `src/app/composables/` agrège risques, zones DVF et filtres pour HomePage. La page reste déclarative.

## Accessibilité (a11y)

- Lien « Aller au contenu » (skip link) visible au focus clavier
- Landmarks : `main`, `role="banner"`, `role="contentinfo"`
- Combobox recherche : `aria-expanded`, `aria-activedescendant`, navigation clavier (↑↓ Entrée Échap)
- Champs avec labels associés, messages d’erreur avec `role="alert"`

## Ajouter une feature

1. Créer `src/features/<nom>/` avec `components/`, `composables/`, `index.ts`
2. Exporter via `@features/<nom>`
3. Importer depuis les pages ou autres features

## Ajouter un endpoint API

1. Créer `src/infrastructure/api/<domaine>.api.ts`
2. Définir l’interface dans `@core/api.types.ts` et l’implémentation dans `clients.ts`
3. Exporter dans `src/infrastructure/api/index.ts`
4. Importer via `@infra/api`
