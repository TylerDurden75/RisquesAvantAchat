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

---

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

Toutes les priorités ci-dessous sont **terminées**. Prochaine cible : Phase 2 (monétisation) ou renforcement Phase 3 (données).

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
