# Stratégie : Descriptif vs Prédictif

**Question** : Devons-nous améliorer les données descriptives avant de passer au prédictif ?

---

## 📊 État actuel des données descriptives

### ✅ Données intégrées (4 sources)
1. **Radon** — Potentiel radon (classe 1-3) via Georisques
2. **Sismicité** — Zone de sismicité (1-5) via Georisques
3. **PPR** — Plans de Prévention des Risques (documents + géométries) via Georisques
4. **Mouvements de terrain** — Aléas mouvement de terrain via Georisques
5. **DVF** — Prix immobiliers (quartier/commune) via Cquest + Tabulaire

### ⚠️ Données manquantes identifiées

#### 1. Retrait-gonflement argiles (mentionné dans le code)
- **Source** : Georisques API `/argiles` ou données BRGM par département
- **Impact** : Risque majeur en France (millions de maisons concernées)
- **Complexité** : Moyenne (données disponibles, nécessite intégration)

#### 2. Submersion marine / élévation niveau mer
- **Source** : Georisques, BRGM, ou données Copernicus
- **Impact** : Important pour zones côtières
- **Complexité** : Moyenne-élevée (données disponibles mais nécessite traitement)

#### 3. Risques technologiques (Seveso)
- **Source** : Georisques API `/seveso`
- **Impact** : Important pour zones industrielles
- **Complexité** : Faible (API disponible, similaire aux autres risques)

#### 4. Historique CATNAT (catastrophes naturelles)
- **Source** : Georisques (déjà dans le rapport PDF général)
- **Impact** : Très important pour crédibilité et contexte
- **Complexité** : Moyenne (nécessite parsing du PDF ou API dédiée)

#### 5. Projets d'aménagement (PLU, SCOT)
- **Source** : APIs publiques locales (hétérogènes)
- **Impact** : Différenciation forte
- **Complexité** : Élevée (données fragmentées, pas d'API centralisée)

---

## 🎯 Recommandation : **OUI, améliorer le descriptif d'abord**

### Arguments pour améliorer le descriptif avant le prédictif

#### 1. **Crédibilité produit** ⭐⭐⭐
- **Problème actuel** : Le produit couvre seulement 4 types de risques sur ~10 majeurs
- **Impact** : Un utilisateur peut avoir un risque majeur (argiles, Seveso) non détecté
- **Résultat** : Perte de confiance, réputation négative

#### 2. **Valeur utilisateur immédiate** ⭐⭐⭐
- **Descriptif** : "Vous avez un risque argiles niveau moyen" → Action immédiate
- **Prédictif** : "Probabilité inondation 23% dans 12 mois" → Moins actionnable pour un achat
- **ROI** : Le descriptif répond directement à "Dois-je acheter ?"

#### 3. **Données nécessaires au prédictif** ⭐⭐
- **Pour prédire l'inondation**, il faut :
  - ✅ Historique CATNAT (à ajouter au descriptif)
  - ✅ Données géographiques (altitude, pente) — pas encore intégrées
  - ✅ Données météo — nouvelles sources
- **Stratégie** : Intégrer l'historique CATNAT dans le descriptif = feature pour le prédictif

#### 4. **Complexité technique** ⭐⭐
- **Descriptif** : Intégration API existantes (Georisques) → 2-3 jours par risque
- **Prédictif** : Pipeline ML complet (ETL, feature engineering, modèle, monitoring) → 2-3 mois minimum
- **Risque** : Passer au prédictif trop tôt = produit incomplet + dette technique

#### 5. **Monétisation** ⭐⭐
- **Descriptif complet** : Justifie un prix premium (9-19€)
- **Prédictif seul** : Difficile à vendre sans descriptif solide
- **Stratégie** : Descriptif = base, Prédictif = différenciation premium

---

## 📋 Plan d'amélioration descriptif (priorisé)

### 🔴 PRIORITÉ HAUTE (Sprint suivant)

#### 1. Retrait-gonflement argiles
- **Pourquoi** : Risque majeur, mentionné dans le code comme "à intégrer"
- **Effort** : 2-3 jours
- **Source** : Georisques API `/argiles?code_insee=...`
- **Valeur** : Complète la couverture des risques majeurs

#### 2. Historique CATNAT (arrêtés de catastrophe naturelle)
- **Pourquoi** : Données déjà disponibles dans le PDF Georisques, très crédible
- **Effort** : 3-5 jours (parsing PDF ou API si disponible)
- **Source** : Georisques (rapport PDF ou API dédiée)
- **Valeur** : Contexte historique = crédibilité + feature pour ML

#### 3. Risques technologiques (Seveso)
- **Pourquoi** : API disponible, similaire aux autres risques
- **Effort** : 2-3 jours
- **Source** : Georisques API `/seveso?code_insee=...`
- **Valeur** : Couverture complète risques majeurs

### 🟡 PRIORITÉ MOYENNE (Mois suivant)

#### 4. Submersion marine
- **Pourquoi** : Important pour zones côtières (15% de la population)
- **Effort** : 4-5 jours
- **Source** : Georisques ou BRGM
- **Valeur** : Différenciation géographique

#### 5. Données géographiques (altitude, pente, distance rivière)
- **Pourquoi** : Nécessaire pour le prédictif ET utile pour le descriptif
- **Effort** : 5-7 jours (intégration IGN ou calculs PostGIS)
- **Source** : IGN (MNT), calculs PostGIS
- **Valeur** : Bridge vers le prédictif + contexte descriptif

### 🟢 PRIORITÉ BASSE (Backlog)

#### 6. PLU / Projets d'aménagement
- **Pourquoi** : Données fragmentées, pas d'API centralisée
- **Effort** : 2-3 semaines (intégration multiple sources)
- **Valeur** : Différenciation forte mais complexe

---

## 🚀 Quand passer au prédictif ?

### Critères de passage au prédictif

✅ **Prêt pour le prédictif quand :**
1. **Descriptif complet** : Au moins 6-7 types de risques majeurs couverts
2. **Données historiques** : Historique CATNAT intégré (ground truth pour ML)
3. **Données géographiques** : Altitude, pente, distance rivière disponibles
4. **Base utilisateurs** : Assez de trafic pour valider la valeur du prédictif
5. **Monétisation** : Descriptif premium fonctionne (justifie investissement ML)

### Timeline recommandée

```
M0-M1 : Fondations produit ✅ (fait)
M2-M3 : Monétisation descriptif (PDF premium, Stripe)
M4-M5 : Amélioration descriptif (argiles, CATNAT, Seveso, submersion)
M6+   : Prédictif (quand descriptif solide + données historiques disponibles)
```

---

## 💡 Recommandation finale

### **OUI, améliorer le descriptif d'abord** — Voici pourquoi :

1. **Gap critique** : Manque argiles (risque majeur) = produit incomplet
2. **ROI immédiat** : 2-3 jours d'effort = valeur utilisateur significative
3. **Prérequis ML** : Historique CATNAT nécessaire pour le prédictif de toute façon
4. **Crédibilité** : Produit complet descriptif = base solide pour vendre le prédictif
5. **Risque** : Passer au prédictif trop tôt = produit incomplet + dette technique

### Plan d'action recommandé

**Sprint actuel** :
- ✅ Architecture sécurisée et scalable (fait)
- ✅ PDF fonctionnel (fait)

**Sprint suivant (2-3 semaines)** :
1. Intégrer retrait-gonflement argiles (2-3 jours)
2. Intégrer historique CATNAT (3-5 jours)
3. Intégrer risques Seveso (2-3 jours)
4. Améliorer affichage données (1-2 jours)

**Résultat** : Produit descriptif complet et crédible avant d'investir dans le ML.

---

## 📊 Comparaison Descriptif vs Prédictif

| Critère | Descriptif | Prédictif |
|---------|-----------|-----------|
| **Valeur utilisateur** | ⭐⭐⭐⭐⭐ Immédiate | ⭐⭐⭐ Moyenne (moins actionnable) |
| **Complexité technique** | ⭐⭐ Faible (APIs) | ⭐⭐⭐⭐⭐ Élevée (ML pipeline) |
| **Temps développement** | 2-3 jours/risque | 2-3 mois minimum |
| **Coût maintenance** | Faible | Élevé (réentraînement, monitoring) |
| **Données nécessaires** | APIs publiques | Historique + météo + géographie |
| **ROI** | Rapide | Long terme |
| **Crédibilité** | Base solide | Difficile sans descriptif |

---

## 🎯 Conclusion

**Réponse : OUI, améliorer le descriptif d'abord.**

**Raisons principales :**
1. Gap critique (argiles manquant)
2. ROI rapide (2-3 jours vs 2-3 mois)
3. Prérequis pour le prédictif (historique CATNAT)
4. Crédibilité produit (complet avant différenciation)

**Timeline recommandée :**
- **M2-M3** : Monétisation descriptif
- **M4-M5** : Amélioration descriptif (argiles, CATNAT, Seveso)
- **M6+** : Prédictif (quand descriptif solide)

**Investissement recommandé :** 2-3 semaines pour compléter le descriptif avant d'investir dans le ML.
