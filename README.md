# RisquesAvantAchat

> Connaître les risques avant d'acheter — Outil d'évaluation des risques environnementaux et géologiques pour les acheteurs immobiliers en France.

## Stack

- **Frontend** : Vue 3, Vite, MapLibre GL
- **Backend** : Node.js, Express, TypeScript
- **Base de données** : PostgreSQL + PostGIS (Docker)

## Démarrage rapide

### Prérequis

- Node.js 20+
- **Yarn** (gestionnaire de paquets utilisé pour ce projet)
- Docker & Docker Compose (optionnel pour la BDD)

### 1. Backend (recommandé)

```bash
cd backend
cp .env.example .env   # optionnel
yarn install
yarn dev
```

L'API écoute sur http://localhost:3000. **Sans backend**, l'app tente un secours direct sur les API Georisques (peut échouer si CORS bloque).

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # optionnel
yarn install
yarn dev
```

L'app est sur http://localhost:5173

### 3. Base de données (optionnel)

```bash
docker compose up -d postgres
```

## Structure du projet

```
RisqueAvantAchat/
├── backend/          # API Express (archi modulaire)
│   └── src/
│       ├── adapters/     # BAN, Georisques, HTTP
│       ├── config/       # env, variables
│       ├── domain/       # types partagés
│       ├── middleware/   # erreurs, CORS, etc.
│       ├── modules/      # bounded contexts
│       │   ├── geocoding/
│       │   ├── geo/      # proxy WMS (BRGM)
│       │   ├── risks/
│       │   ├── report/
│       │   └── dvf/
│       ├── routes/       # assemblage des routes
│       └── utils/        # cache LRU, logger
├── frontend/         # App Vue 3 (archi par features)
│   └── src/
│       ├── app/          # HomePage, router, contextes
│       ├── features/     # address, geo, risks, dvf
│       ├── shared/       # composants communs
│       ├── infrastructure/ # API clients, HTTP
│       └── core/         # types, config
├── shared/           # types partagés (shared-types)
├── docker-compose.yml
└── README.md
```

## API

Toutes les routes métier sont préfixées par **`/api/v1`**. Le health check est à la racine.

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/v1/addresses/search?q=` | Recherche d'adresse (API BAN) |
| GET | `/api/v1/risks/nearby?lat=&lng=&code_insee=` | Risques à proximité (code_insee recommandé, inclut parcelle si dispo) |
| GET | `/api/v1/risks/zones?code_insee=` | Zones PPR (GeoJSON) pour la carte |
| GET | `/api/v1/risks/etat-des-risques?code_insee=&lat=&lng=` | Pré-remplissage état des risques (JSON) |
| GET | `/api/v1/cadastre/parcelle?lat=&lng=` | Parcelle cadastrale au point (API Carto IGN) |
| GET | `/api/v1/dvf/indicators?code_insee=&lat=&lon=` | Indicateurs DVF (prix m², mutations) |
| GET | `/api/v1/geo/wms?layer=&bbox=...` | Proxy tuiles WMS BRGM (carte) |
| POST | `/api/v1/report` | Générer un rapport (body: `{ address, coords }`) |
| POST | `/api/v1/report/pdf` | Télécharger le rapport en PDF |
| GET | `/api/v1/report/:id` | Récupérer un rapport par id |

Les risques (radon, sismicité, PPR, MVT, RGA, AZI, CATNAT, etc.) sont récupérés via l’**API Georisques** (v2). Voir [docs/API_GEORISQUES_V2.md](docs/API_GEORISQUES_V2.md) et la [doc officielle V2](https://www.georisques.gouv.fr/doc-api?urls.primaryName=Api%20de%20G%C3%A9orisques%20V2#/).

## Documentation (JSDoc / TypeDoc)

Génération de la doc API :

```bash
cd backend && yarn docs   # → backend/docs/
cd frontend && yarn docs # → frontend/docs/
```

Les blocs JSDoc (`/** ... */`) sont utilisés partout pour `@param`, `@returns`, `@example`, etc.

## Licence

Voir le brief projet pour les contraintes légales (données Etalab, disclaimer).
