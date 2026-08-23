/**
 * Captures comparatives handoff ↔ navigateur (protocole §3).
 * 1. Extrait les écrans de référence du handoff (frames §5.1, §5.2, §6.1, §6.2).
 * 2. Recapture les pages réelles aux mêmes largeurs.
 * Les planches côte à côte sont assemblées ensuite (PIL).
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = 'tests/qa/artefacts/comparatif';
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.argv[2] ?? 'http://localhost:4321';

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
const page = await context.newPage();

// --- 1. Références du handoff ---
const handoff =
  'file://' +
  path.resolve(
    '/tmp/claude-0/-home-user-senesource/665a96e3-7dc3-5fc2-88b5-c068c6ca6ef0/scratchpad/handoff-plain.html',
  );
await page.goto(handoff, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(800);

const refs = [
  { cap: '5.1 · HOMEPAGE', fichier: 'ref_homepage_390.png' },
  { cap: '5.2 · VÉRIFICATION — AVEC VERDICT', fichier: 'ref_dossier_390.png' },
  { cap: '6.1 · HOMEPAGE DESKTOP', fichier: 'ref_homepage_1280.png' },
  { cap: '6.2 · VÉRIFICATION DESKTOP', fichier: 'ref_dossier_1280.png' },
];
for (const r of refs) {
  const frame = page.locator('.scr', { has: page.locator('.cap', { hasText: r.cap }) }).locator('.frame').first();
  await frame.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await frame.screenshot({ path: `${OUT}/${r.fichier}` });
  console.log('ref ok :', r.fichier);
}

// --- 2. Rendu réel aux mêmes largeurs ---
const pages = [
  { chemin: '/', nom: 'homepage' },
  { chemin: '/dossier/041-taxe-paiements-especes-carburant/', nom: 'dossier' },
];
for (const p of pages) {
  for (const w of [390, 1280]) {
    await page.setViewportSize({ width: w, height: w === 390 ? 844 : 800 });
    await page.goto(BASE + p.chemin, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/rendu_${p.nom}_${w}.png`, fullPage: true });
    console.log('rendu ok :', `rendu_${p.nom}_${w}.png`);
  }
}

await browser.close();
