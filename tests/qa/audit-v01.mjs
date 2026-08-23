/**
 * Audit QA V0.1 — homepage + dossier 041 (protocole 04-qa-protocoles.md §2).
 * Captures 5 viewports, scan radius/ombres/couleurs, overflow, axe-core,
 * tailles typo relevées (comparaison au handoff), poids transférés.
 * Usage : node tests/qa/audit-v01.mjs <baseURL>
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const PAGES = [
  { nom: 'homepage', chemin: '/' },
  { nom: 'dossier-041', chemin: '/dossier/041-taxe-paiements-especes-carburant/' },
];
const OUT = 'tests/qa/artefacts';
fs.mkdirSync(OUT, { recursive: true });

const HEXES = [
  'faf8f4','f2eee6','17161a','33312c','57534b','6b665d','a19a8d','e0dbd1','a2621b','d9a25e','f6e3c4',
  '2b2925','4a4741','d8d2c7','4d4a43','a79e90','b5ac9d','7d766b','efebe3','ffffff','dcd6cb','8b8579','ede8de',
];
const toRGB = (h) => `rgb(${parseInt(h.slice(0,2),16)}, ${parseInt(h.slice(2,4),16)}, ${parseInt(h.slice(4,6),16)})`;
const ALLOWED = new Set(HEXES.map(toRGB));

const VIEWPORTS = [
  { name: '360x640', width: 360, height: 640 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
];

const findings = [];
const note = (sev, code, msg) => findings.push({ sev, code, msg });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const context = await browser.newContext();
const page = await context.newPage();

// Poids transférés (première visite, homepage)
const transferts = [];
page.on('response', async (r) => {
  try {
    const len = (await r.body()).length;
    transferts.push({ url: r.url().replace(BASE, ''), type: r.request().resourceType(), octets: len });
  } catch {}
});

for (const p of PAGES) {
  await page.goto(BASE + p.chemin, { waitUntil: 'networkidle' });

  // Scan radius / ombres / couleurs
  const scan = await page.evaluate(() => {
    const bad = { radius: [], shadow: [], colors: new Map() };
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const id = el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '');
      if (cs.borderRadius !== '0px') bad.radius.push(`${id}: ${cs.borderRadius}`);
      if (cs.boxShadow !== 'none') bad.shadow.push(`${id}: ${cs.boxShadow}`);
      for (const prop of ['color','backgroundColor','borderTopColor','borderLeftColor','textDecorationColor','outlineColor']) {
        const v = cs[prop];
        if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
        const solid = v.replace(/rgba\((\d+), (\d+), (\d+), [\d.]+\)/, 'rgb($1, $2, $3)');
        if (!bad.colors.has(solid)) bad.colors.set(solid, id + ':' + prop);
      }
    }
    return { radius: bad.radius.slice(0,10), shadow: bad.shadow.slice(0,10), colors: [...bad.colors.entries()] };
  });
  for (const r of scan.radius) note('BLOCAGE', 'B1', `${p.nom} — border-radius : ${r}`);
  for (const s of scan.shadow) note('BLOCAGE', 'B2', `${p.nom} — ombre : ${s}`);
  for (const [c, where] of scan.colors.filter(([c]) => !ALLOWED.has(c)))
    note('BLOCAGE', 'A1', `${p.nom} — couleur hors tokens : ${c} (${where})`);

  // grep états cassés
  const html = await page.content();
  for (const motif of ['undefined', 'NaN', 'Invalid Date', 'null,']) {
    if (html.includes(motif)) note('BLOCAGE', 'E9', `${p.nom} — chaîne « ${motif} » dans le DOM`);
  }

  // Multi-viewports
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(120);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (overflow) note('BLOCAGE', 'D3', `${p.nom} — débordement horizontal à ${vp.name}`);
    await page.screenshot({ path: `${OUT}/${p.nom}_${vp.name}.png`, fullPage: true });
  }

  // Relevé typographique (390 et 1280) pour la grille de fidélité
  for (const [nom, w, h] of [['390', 390, 844], ['1280', 1280, 800]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(100);
    const releve = await page.evaluate(() => {
      const mesure = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const cs = getComputedStyle(el);
        return {
          famille: cs.fontFamily.split(',')[0].replace(/"/g, ''),
          taille: cs.fontSize,
          interligne: cs.lineHeight,
          graisse: cs.fontWeight,
          interlettrage: cs.letterSpacing,
          style: cs.fontStyle,
          couleur: cs.color,
        };
      };
      return {
        titre: mesure('h1'),
        verdict: mesure('.typo-verdict, .verdict-mot'),
        chiffre: mesure('.typo-chiffre'),
        corps: mesure('.typo-corps, .verdict-resume'),
        label: mesure('.typo-label, .verdict-etiquette'),
        citation: mesure('.typo-citation'),
      };
    });
    fs.writeFileSync(`${OUT}/${p.nom}_typo_${nom}.json`, JSON.stringify(releve, null, 2));
  }

  // axe-core mobile + desktop
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    await page.setViewportSize({ width: w, height: h });
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    for (const v of axe.violations) {
      const sev = ['critical', 'serious'].includes(v.impact) ? 'BLOCAGE' : 'REMARQUE';
      note(sev, 'F', `${p.nom}@${w} — axe ${v.impact} — ${v.id} : ${v.help} (${v.nodes.length}) ${v.nodes[0]?.target?.[0] ?? ''}`);
    }
  }
}

// Bilan poids (dédupliqué par URL)
const parType = {};
const vus = new Set();
for (const t of transferts) {
  if (vus.has(t.url)) continue;
  vus.add(t.url);
  parType[t.type] = (parType[t.type] ?? 0) + t.octets;
}
const js = (parType['script'] ?? 0) / 1024;
if (js > 0) note(js > 170 ? 'BLOCAGE' : 'REMARQUE', 'JS', `JS transféré : ${js.toFixed(1)} Ko`);

await browser.close();

const blocages = findings.filter((f) => f.sev === 'BLOCAGE');
const remarques = findings.filter((f) => f.sev !== 'BLOCAGE');
fs.writeFileSync(
  `${OUT}/audit-v01.json`,
  JSON.stringify({ date: new Date().toISOString(), blocages, remarques, poids: parType }, null, 2),
);
console.log('=== AUDIT V0.1 ===');
console.log('Poids transférés (octets) :', JSON.stringify(parType));
console.log(`Blocages : ${blocages.length}`);
for (const f of blocages) console.log(`  [${f.code}] ${f.msg}`);
console.log(`Remarques : ${remarques.length}`);
for (const f of remarques) console.log(`  [${f.code}] ${f.msg}`);
process.exit(blocages.length ? 1 : 0);
