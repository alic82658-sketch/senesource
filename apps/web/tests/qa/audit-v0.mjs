/**
 * Audit QA V0 — page /design-system (protocole 04-qa-protocoles.md §1).
 * - Captures multi-viewports (baseline)
 * - Scan radius / ombres / couleurs hors tokens / gris Tailwind
 * - Débordement horizontal
 * - Polices chargées (Newsreader / Public Sans / IBM Plex Mono)
 * - axe-core WCAG 2.1 AA
 * Usage : node tests/qa/audit-v0.mjs <baseURL>
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const PAGE = '/design-system/';
const OUT = 'tests/qa/artefacts';
fs.mkdirSync(OUT, { recursive: true });

// Palette autorisée (tokens.css) → RGB résolus
const HEXES = [
  // §1 palette fermée
  'faf8f4','f2eee6','17161a','33312c','57534b','6b665d','a19a8d','e0dbd1','a2621b','d9a25e','f6e3c4',
  // valeurs relevées dans les gabarits normatifs (documentées dans tokens.css)
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

// Gris Tailwind par défaut (extraits gray/slate/zinc/neutral/stone les plus fréquents)
const TW_GREYS = new Set([
  '6b7280','9ca3af','e5e7eb','f3f4f6','111827','64748b','94a3b8','e2e8f0','f1f5f9','0f172a',
  '71717a','a1a1aa','e4e4e7','fafafa','18181b','737373','a3a3a3','e5e5e5','171717',
  '78716c','a8a29e','e7e5e4','f5f5f4','1c1917',
].map(toRGB));

const findings = [];
const note = (sev, code, msg) => findings.push({ sev, code, msg });

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(BASE + PAGE, { waitUntil: 'networkidle' });

// ---- Polices chargées ----
const fontsOk = await page.evaluate(async () => {
  await document.fonts.ready;
  return {
    newsreader: document.fonts.check('16px Newsreader'),
    newsreaderIt: document.fonts.check('italic 16px Newsreader'),
    publicSans: document.fonts.check("16px 'Public Sans'"),
    plexMono: document.fonts.check("16px 'IBM Plex Mono'"),
  };
});
for (const [k, v] of Object.entries(fontsOk)) {
  if (!v) note('BLOCAGE', 'C1', `Police non chargée : ${k}`);
}

// ---- Scan DOM : radius, ombres, couleurs ----
const scan = await page.evaluate(() => {
  const bad = { radius: [], shadow: [], colors: new Map() };
  const els = document.querySelectorAll('*');
  for (const el of els) {
    const cs = getComputedStyle(el);
    const id = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '');
    if (cs.borderRadius !== '0px') bad.radius.push(`${id}: ${cs.borderRadius}`);
    if (cs.boxShadow !== 'none') bad.shadow.push(`${id}: ${cs.boxShadow}`);
    if (cs.textShadow !== 'none') bad.shadow.push(`${id}: text-shadow ${cs.textShadow}`);
    for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor', 'textDecorationColor', 'outlineColor']) {
      const v = cs[prop];
      if (!v || v === 'rgba(0, 0, 0, 0)' || v === 'transparent') continue;
      const solid = v.replace(/rgba\((\d+), (\d+), (\d+), [\d.]+\)/, 'rgb($1, $2, $3)');
      if (!bad.colors.has(solid)) bad.colors.set(solid, id + ':' + prop);
    }
  }
  return { radius: bad.radius.slice(0, 20), shadow: bad.shadow.slice(0, 20), colors: [...bad.colors.entries()] };
});
for (const r of scan.radius) note('BLOCAGE', 'B1', `border-radius non nul : ${r}`);
for (const s of scan.shadow) note('BLOCAGE', 'B2', `ombre détectée : ${s}`);
const unknown = scan.colors.filter(([c]) => !ALLOWED.has(c));
for (const [c, where] of unknown) {
  const sev = TW_GREYS.has(c) ? 'BLOCAGE' : 'A_VERIFIER';
  note(sev, 'A1', `couleur hors tokens : ${c} (${where})`);
}

// ---- Multi-viewports : captures + débordement + tailles mini ----
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(120);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  if (overflow) note('BLOCAGE', 'D3', `débordement horizontal à ${vp.name}`);
  await page.screenshot({ path: `${OUT}/design-system_${vp.name}.png`, fullPage: true });
}

// ---- Tailles de police minimales (à 360px) ----
await page.setViewportSize({ width: 360, height: 640 });
const tiny = await page.evaluate(() => {
  const out = new Set();
  for (const el of document.querySelectorAll('*')) {
    if (!el.childNodes.length) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 9) out.add(`${el.tagName.toLowerCase()}: ${size}px`);
  }
  return [...out];
});
for (const t of tiny) note('BLOCAGE', 'C4', `texte < 9px : ${t}`);

// ---- axe-core ----
await page.setViewportSize({ width: 390, height: 844 });
const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
for (const v of axe.violations) {
  const sev = ['critical', 'serious'].includes(v.impact) ? 'BLOCAGE' : 'REMARQUE';
  note(sev, 'F', `axe ${v.impact} — ${v.id} : ${v.help} (${v.nodes.length} nœud·s) ${v.nodes[0]?.target?.[0] ?? ''}`);
}

await browser.close();

// ---- Rapport ----
const blocages = findings.filter((f) => f.sev === 'BLOCAGE');
const remarques = findings.filter((f) => f.sev !== 'BLOCAGE');
const rapport = { date: new Date().toISOString(), page: PAGE, blocages, remarques };
fs.writeFileSync(`${OUT}/audit-v0.json`, JSON.stringify(rapport, null, 2));
console.log(`\n=== AUDIT V0 — ${PAGE} ===`);
console.log(`Blocages : ${blocages.length}`);
for (const f of blocages) console.log(`  [${f.code}] ${f.msg}`);
console.log(`Remarques / à vérifier : ${remarques.length}`);
for (const f of remarques) console.log(`  [${f.code}] ${f.msg}`);
process.exit(blocages.length ? 1 : 0);
