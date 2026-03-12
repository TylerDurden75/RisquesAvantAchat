# Roadmap RisquesAvantAchat

Feuille de route pour renforcer la valeur du produit et son potentiel de monétisation.

---

## Architecture, MVP & scalabilité (à ne pas oublier)

### Note actuelle
- **Archi** : ~7,5/10 pour un MVP, 8/10 en maintenabilité (modulaire, caches LRU, versioning API, retry Georisques, logging avec contexte).
- **MVP** : Oui, bien adapté — livrable sans sur-investissement, code propre et testé.
- **Scalable** : Oui, à condition d’ajouter les briques suivantes au bon moment.

### Scalabilité trafic — à planifier
- **Court terme (×2–×5)** : Reverse proxy (Nginx/Caddy) devant l’API, cache HTTP sur réponses stables, `ALLOWED_ORIGINS` obligatoire en prod ✅.
- **Moyen terme (×10–×50)** : Plusieurs instances derrière un load balancer. **Cache partagé Redis** pour risques/zones/DVF (au lieu du LRU en mémoire par process).
- **Long terme** : PostgreSQL + migrations si historique / utilisateurs ; **observabilité** (métriques, logs structurés JSON, alertes Sentry/Datadog) ; rate limiting affiné (par IP / par user si auth).

### À faire technique (backlog)
- [ ] Rate limit ciblé sur `/api/v1/report/pdf` si besoin.
- [ ] Circuit breaker (ex. opossum) pour Georisques en cas de panne prolongée.
- [ ] Observabilité : logs structurés (JSON), métriques (temps de réponse, erreurs), optionnel Sentry/Datadog.
- [ ] Documentation API : OpenAPI/Swagger.

### Sécurité — état et points de vigilance
- **Déjà en place** : Helmet (en-têtes sécurisés), CORS avec `ALLOWED_ORIGINS` obligatoire en prod, rate limit global (60 req/min en prod), validation Zod sur la plupart des routes (risques, DVF, géocodage, rapport), body JSON limité à 1 Mo, WMS proxy avec whitelist de calques + regex sur bbox, cadastre avec contrôle lat/lng. Pas de requêtes SQL construites à partir d’entrées utilisateur ; secrets (token Georisques) en variables d’environnement.
- **À renforcer** : (1) Rate limit **spécifique** sur `/api/v1/report/pdf` (génération PDF coûteuse en CPU → risque DoS). (2) Valider le paramètre `id` sur `GET /report/:id` (format attendu) si un jour stockage par id. (3) En production build, durcir la CSP (réduire `unsafe-inline` / `unsafe-eval` si possible avec Vue/MapLibre). (4) DVF : borner lat/lon dans le schéma Zod (ex. -90/90, -180/180) si utilisés pour des appels externes.

### 100K+ connexions — est-ce que ça tiendra ?
- **Aujourd’hui : non**, sans évolutions. Une seule instance Node, rate limit 60 req/min par IP, caches LRU **en mémoire** (non partagés entre instances), génération PDF synchrone dans la requête. Pour viser 100K connexions ou plus il faut : **reverse proxy** (Nginx/Caddy) + **cache HTTP** sur les réponses stables ; **plusieurs instances** derrière un **load balancer** ; **cache partagé Redis** (risques, DVF, zones) pour que toutes les instances partagent le même cache ; **rate limiting** affiné (par route, ex. PDF plus strict) et éventuellement **file d’attente** pour les PDF ; **observabilité** (métriques, alertes) pour détecter les goulots. L’API est **stateless** (pas de session en mémoire), ce qui facilite la montée en charge horizontale une fois le cache externalisé.
- **Actuellement** : le sélecteur 500 m / 1 km / 2 km / 5 km ne fait que redimensionner le cercle sur la carte ; les données (score, liste de risques) restent à l’échelle de la **commune** (code Insee).
- [ ] **À faire** : faire dépendre les données du rayon — soit via l’API Georisques v2 avec lat/lon/rayon si supporté, soit en résolvant les **communes dans le cercle** et en agrégeant leurs risques. Ainsi le score et la liste des risques évolueraient quand l’utilisateur change de zone.

### Prix DVF — affiner la granularité ✅
- **Implémenté** : **cascade de rayons** 250 m → 500 m → 1 km via API Cquest ; on retient le premier niveau avec ≥ 5 ventes. Le champ `rayonMeters` et le libellé (ex. « quartier (~250 m) ») sont affichés côté frontend et dans le PDF. Fallback sur moyenne communale (Tabulaire) si aucun rayon n’a assez de données.

### Prix DVF — granularité parcellaire (APIs / alternatives) ✅
- **Implémenté** : DVF par **parcelle** puis **section** (API Cquest `numero_plan` / `section`). La parcelle est fournie par le module cadastre (IGN) ; construction des identifiants `section_cquest` et `numero_plan` au format DGFiP. Cascade : parcelle → section → rayons 250/500/1000 m → commune. Affichage « parcelle cadastrale » / « section cadastrale » dans l’UI et le PDF.
- **Référence** : `docs/DVF_PARCELLAIRE.md`.

### Prix DVF — fiabilité API (instance Cquest en propre) — à planifier
- **Constat** : L’API publique `api.cquest.org/dvf` est souvent indisponible (502), ce qui fait retomber systématiquement sur le prix à l’échelle de la commune (Tabulaire).
- **Meilleure solution gratuite** : **Héberger sa propre instance** de [dvf_as_api](https://github.com/cquest/dvf_as_api) (même API : lat/lon/dist, section, numero_plan). Nécessite PostgreSQL + import des données DVF (scripts fournis). Une fois en place : plus de dépendance à l’instance publique, pas de 502, même granularité parcelle / section / quartier.
- [ ] **À faire** : (1) Rendre l’URL de l’API DVF Cquest **configurable** via variable d’environnement (ex. `CQUEST_DVF_API_URL`, défaut `https://api.cquest.org/dvf`). (2) Documenter le déploiement d’une instance dvf_as_api (Docker/PostgreSQL, import DVF). (3) Optionnel : déployer une instance dédiée pour la prod.

## Phase 1 — Fondations produit (M0–M1)

### 1.1 Score de risque enrichi ✅
- [x] Interprétation qualitative (À éviter / À surveiller / Bien géré)
- [x] Recommandations par type de risque
- [x] Affichage recommandations dans ScoreBlock / RisksCard

### 1.2 Liens partageables ✅
- [x] URL avec paramètres (`?lat=&lon=&label=`)
- [x] Restauration de l'adresse au chargement (reverse géocodage BAN)
- [x] Bouton « Copier le lien » dans RisksCard

### 1.3 SEO & métadonnées ✅
- [x] Meta title / description dynamiques selon l'adresse
- [x] Open Graph (og:title, og:description, og:image, og:url)

---

## Phase 2 — Monétisation (M2–M3)

### 2.1 Rapport premium
- [ ] PDF enrichi (score, graphiques, recommandations détaillées)
- [ ] Stripe ou alternative (paiement 9–19 €)
- [ ] Limiter gratuit : 1 rapport / jour ou version courte

### 2.2 Comptes Pro (B2B)
- [ ] Auth simple (email + mot de passe)
- [ ] Abonnement (ex. 49 €/mois, 20 rapports)
- [ ] Dashboard usage / historique

---

## Phase 3 — Différenciation (M4–M6)

### 3.1 Extension navigateur
- [ ] Survol annonces (Le Bon Coin, SeLoger) → affichage score
- [ ] Chrome / Firefox

### 3.2 API publique
- [ ] Endpoints REST documentés
- [ ] Clé API / rate limiting
- [ ] Documentation (OpenAPI)

### 3.3 Données additionnelles
- [x] Retrait-gonflement argiles ✅
- [x] AZI (Atlas des zones inondables) ✅
- [ ] Submersion marine / élévation niveau mer
- [ ] Projets d'aménagement (PLU)
- [ ] Historique sinistres (si données ouvertes)

### 3.4 Surpasser ERRIAL
Voir **docs/SURPASSER_ERRIAL.md** pour le plan détaillé.

- [x] **CATNAT** — arrêtés catastrophe naturelle (API Georisques) ✅
- [x] **SIS + BASIAS** — sites et sols pollués, anciens sites industriels ✅
- [x] **Parcelle cadastrale** — adresse → parcelle (API Carto Cadastre) pour exhaustivité ✅
- [x] **Installations classées** — risques technologiques (API Georisques) ✅
- [x] **Pré-remplissage** formulaire état des risques (endpoint JSON `/risks/etat-des-risques`) ✅

---

## Phase 4 — Risque prédictif (M6+)

Passer du descriptif (Georisques) au **prédictif** via ML pour proposer des probabilités de risque.

### 4.1 Cibles de prédiction (prioriser)
- [ ] Probabilité inondation (parcelle / maille)
- [ ] Risque mouvement de terrain
- [ ] Retrait-gonflement argiles
- [ ] Occurrence CATNAT sur 12 mois

### 4.2 Sources de données (features)
- [ ] **Risques historiques** : Géorisques, BRGM (mouvements, cavités, argiles), EM-DAT
- [ ] **Météo** : Météo-France (pluie, sécheresse), Copernicus (humidité sol)
- [ ] **Géographie** : IGN (altitude, MNT, pente), INSEE (densité, urbanisation)

### 4.3 Modèle et pipeline
- [ ] Feature engineering : cumul pluie 7j/30j, pente, distance rivière, fréquence CATNAT passée
- [ ] Modèle : Random Forest / XGBoost (AUC + recall pour risques rares)
- [ ] Maille : commune ou 250 m
- [ ] Architecture : ETL → PostGIS → entraînement → API score de risque

### 4.4 Cas concret : inondation
- Features : cumul pluie 3j/7j, humidité sol, altitude relative, distance rivière, historique CATNAT, artificialisation
- Sortie : probabilité événement > seuil

### 4.5 Points de vigilance
- Accès données (licences Météo-France, Copernicus, IGN)
- Ground truth (arrêtés CATNAT incomplets/hétérogènes)
- Réentraînement périodique, monitoring dérive
- Temps réel : météo live + capteurs hydrologiques + satellite si besoin

---

## Priorité immédiate (sprint actuel)

Toutes les priorités ci-dessous sont **terminées**. Prochaine cible : **Phase 3.4 Surpasser ERRIAL** (voir docs/SURPASSER_ERRIAL.md), puis Phase 2 (monétisation).

1. **Score enrichi** — interprétation + recommandations → crédibilité ✅
2. **Liens partageables** — viralité + SEO ✅
3. **Prix DVF à l'adresse** — tentative API quartier (rayon 500 m), fallback commune ✅
4. **SEO** — og:image, meta dynamiques, Twitter Card ✅
5. **Gestion erreurs** — bouton Réessayer (risques + recherche) ✅
6. **Loading states** — skeletons, spinners (carte, router, recherche, risques) ✅

---

## Légende

- ✅ Fait
- [ ] À faire
- M0 = mois 0 (actuel)
