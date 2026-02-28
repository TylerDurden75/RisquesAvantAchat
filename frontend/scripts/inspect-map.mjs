/**
 * Script d'inspection : vérifie l'affichage de la carte MapLibre et la structure DOM
 */
import { chromium } from 'playwright';

const url = 'http://localhost:5173/';
const consoleLogs = [];
const consoleErrors = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

// Capturer les logs console
page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error') {
    consoleErrors.push({ type: 'error', text });
  } else {
    consoleLogs.push({ type: msg.type(), text });
  }
});

console.log('🔗 Navigation vers', url);
await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });

// Attendre le chargement de MapLibre (canvas ou région Map)
await page.waitForTimeout(3000);

// Structure DOM du conteneur carte
const mapContainer = await page.locator('.map-container').first();
const exists = await mapContainer.count() > 0;
const mapHTML = exists ? await mapContainer.evaluate((el) => el.outerHTML) : 'NON TROUVÉ';

// Vérifier le canvas MapLibre (créé par maplibre-gl à l'intérieur du container)
const canvas = await page.locator('.map-container canvas.maplibregl-canvas').first();
const canvasExists = await canvas.count() > 0;

// Vérifier la région Map (aria-label)
const mapRegion = await page.locator('[aria-label="Map"]').first();
const regionExists = await mapRegion.count() > 0;

// Contrôles de navigation
const zoomIn = await page.locator('button[aria-label="Zoom in"]').first();
const zoomInExists = await zoomIn.count() > 0;

console.log('\n========== RÉSULTAT INSPECTION ==========');
console.log('\n📦 Conteneur .map-container:', exists ? 'TROUVÉ' : 'NON TROUVÉ');
console.log('\n📐 Structure DOM du conteneur (.map-container):');
console.log(mapHTML.substring(0, 800) + (mapHTML.length > 800 ? '...' : ''));

console.log('\n🗺️ Canvas MapLibre (.maplibregl-canvas):', canvasExists ? 'TROUVÉ' : 'NON TROUVÉ');
console.log('📍 Région Map ([aria-label="Map"]):', regionExists ? 'TROUVÉ' : 'NON TROUVÉ');
console.log('🔍 Contrôle Zoom in:', zoomInExists ? 'TROUVÉ' : 'NON TROUVÉ');

console.log('\n⚠️ Erreurs console:', consoleErrors.length);
consoleErrors.forEach((e) => console.log('  -', e.text));

console.log('\n📋 Derniers logs console (non erreur):');
consoleLogs.slice(-5).forEach((l) => console.log('  -', l.text));

// Dimensions du conteneur
if (exists) {
  const rect = await mapContainer.boundingBox();
  console.log('\n📏 Dimensions du conteneur:', rect ? `${rect.width}x${rect.height}px` : 'N/A');
}

await browser.close();
