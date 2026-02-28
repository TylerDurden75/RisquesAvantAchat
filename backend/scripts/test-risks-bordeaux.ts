/**
 * Script de test : appelle le service risques pour Bordeaux (33063).
 * À lancer depuis backend/ : npx tsx scripts/test-risks-bordeaux.ts
 *
 * Si ce script affiche des catégories/documents, le problème vient du frontend ou du cache.
 * Si ce script n'affiche rien, le problème vient du service ou des appels Georisques.
 */

import '../src/loadEnv.js';
import { risksService } from '../src/modules/risks/risks.service.js';

const CODE_INSEE = '33063';
const COORDS: [number, number] = [-0.587877, 44.851897];

async function main() {
  console.log('Test getRisksNearby pour Bordeaux', { CODE_INSEE, COORDS });
  console.log('');

  try {
    const result = await risksService.getRisksNearby(COORDS, 500, CODE_INSEE);
    console.log('globalScore:', result.globalScore);
    console.log('scoreInterpretation:', result.scoreInterpretation);
    console.log('categories:', result.categories.length);
    result.categories.forEach((c, i) => {
      console.log(`  [${i}] ${c.name}: ${c.description} (level ${c.level})`);
    });
    console.log('documents:', result.documents.length);
    result.documents.forEach((d, i) => {
      console.log(`  [${i}] ${d.name} - ${d.riskType}`);
    });
    if (result.categories.length === 0 && result.documents.length === 0) {
      console.log('\n⚠️ Aucune catégorie ni document. Vérifier GEORISQUES_API_TOKEN dans .env');
    }
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
}

main();
