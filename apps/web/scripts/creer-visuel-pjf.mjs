/**
 * Produit les trois déclinaisons du dossier 061 à partir de la photographie
 * authentique fournie à la rédaction. Le panneau officiel reste une image :
 * aucun texte ni logo du PJF n'est régénéré.
 *
 * Usage : node apps/web/scripts/creer-visuel-pjf.mjs [photo-source]
 */
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(webRoot, '..', '..');

function chargerSharp() {
  try {
    return require('sharp');
  } catch {
    const store = path.join(repoRoot, 'node_modules', '.pnpm');
    const dossier = readdirSync(store).find((nom) => /^sharp@/.test(nom));
    if (!dossier) throw new Error('sharp introuvable dans le store pnpm');
    return require(path.join(store, dossier, 'node_modules', 'sharp'));
  }
}

const sharp = chargerSharp();
const source = path.resolve(
  process.argv[2] ?? path.join(webRoot, 'public', 'sources', '061-pjf-devanture-originale.jpeg'),
);
const illustrationsDir = path.join(webRoot, 'public', 'illustrations');
const ogDir = path.join(webRoot, 'public', 'og');
const socialDir = path.join(webRoot, 'public', 'social');
mkdirSync(illustrationsDir, { recursive: true });
mkdirSync(ogDir, { recursive: true });
mkdirSync(socialDir, { recursive: true });

const couleurs = {
  papier: '#F7F4EC',
  encre: '#17161A',
  bleu: '#0B2341',
  rouge: '#8F2034',
  vert: '#0B6642',
  jaune: '#F2C500',
};

const logoSvg = readFileSync(path.join(webRoot, 'public', 'logo-senesource.svg'));

const filetTricolore = (largeur) => Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="9">
    <rect width="${largeur / 3}" height="9" fill="${couleurs.vert}"/>
    <rect x="${largeur / 3}" width="${largeur / 3}" height="9" fill="${couleurs.jaune}"/>
    <rect x="${(largeur * 2) / 3}" width="${largeur / 3}" height="9" fill="${couleurs.rouge}"/>
  </svg>
`);

async function photoRedimensionnee(largeur, hauteur, position = 'centre') {
  return sharp(source)
    .rotate()
    .resize(largeur, hauteur, { fit: 'cover', position, kernel: 'lanczos3' })
    .sharpen({ sigma: 0.65, m1: 0.5, m2: 1.2 })
    .modulate({ saturation: 0.96, brightness: 1.02 })
    .toBuffer();
}

async function creerHero() {
  const largeur = 1600;
  const hauteur = 900;
  const photo = await photoRedimensionnee(largeur, hauteur, 'north');
  const degrade = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${largeur}" height="${hauteur}">
      <defs>
        <linearGradient id="bas" x1="0" y1="0" x2="0" y2="1">
          <stop offset="68%" stop-color="${couleurs.bleu}" stop-opacity="0"/>
          <stop offset="100%" stop-color="${couleurs.bleu}" stop-opacity="0.58"/>
        </linearGradient>
      </defs>
      <rect width="${largeur}" height="${hauteur}" fill="url(#bas)"/>
    </svg>
  `);
  const logoFond = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="350" height="98">
      <rect width="350" height="98" fill="${couleurs.papier}" fill-opacity="0.96"/>
    </svg>
  `);
  const logo = await sharp(logoSvg).resize(300, 75, { fit: 'contain' }).png().toBuffer();

  await sharp(photo)
    .composite([
      { input: degrade, top: 0, left: 0 },
      { input: filetTricolore(largeur), top: 0, left: 0 },
      { input: logoFond, top: 774, left: 1206 },
      { input: logo, top: 786, left: 1231 },
    ])
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(illustrationsDir, '061-pjf-100-milliards-recouvres.webp'));
}

function texteOg() {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="250">
      <rect width="1200" height="250" fill="${couleurs.papier}"/>
      <rect width="1200" height="2" fill="${couleurs.encre}" opacity="0.25"/>
      <text x="58" y="54" fill="${couleurs.rouge}" font-family="Nimbus Sans, DejaVu Sans, sans-serif" font-size="22" font-weight="700" letter-spacing="3">JUSTICE</text>
      <text x="58" y="126" fill="${couleurs.encre}" font-family="Nimbus Sans, DejaVu Sans, sans-serif" font-size="54" font-weight="700" letter-spacing="-1">100 MILLIARDS RÉCUPÉRÉS ?</text>
      <text x="58" y="179" fill="#514F55" font-family="Nimbus Sans, DejaVu Sans, sans-serif" font-size="27" font-weight="400">Saisi ≠ confisqué ≠ recouvré</text>
    </svg>
  `);
}

async function creerOg() {
  const photo = await photoRedimensionnee(1200, 380, 'north');
  const logo = await sharp(logoSvg).resize(236, 59, { fit: 'contain' }).png().toBuffer();
  const fond = await sharp({
    create: { width: 1200, height: 630, channels: 4, background: couleurs.papier },
  })
    .composite([
      { input: photo, top: 0, left: 0 },
      { input: filetTricolore(1200), top: 0, left: 0 },
      { input: texteOg(), top: 380, left: 0 },
      { input: logo, top: 550, left: 907 },
    ])
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4', mozjpeg: true })
    .toBuffer();
  await sharp(fond).toFile(path.join(ogDir, '061-pjf-100-milliards-recouvres.jpg'));
}

function texteSocial() {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="870">
      <rect width="1200" height="870" fill="${couleurs.papier}"/>
      <rect width="1200" height="2" fill="${couleurs.encre}" opacity="0.25"/>
      <text x="78" y="104" fill="${couleurs.rouge}" font-family="Nimbus Sans, DejaVu Sans, sans-serif" font-size="32" font-weight="700" letter-spacing="4">JUSTICE</text>
      <text x="76" y="245" fill="${couleurs.encre}" font-family="Nimbus Sans, DejaVu Sans, sans-serif" font-size="92" font-weight="700" letter-spacing="-2">100 MILLIARDS</text>
      <text x="76" y="353" fill="${couleurs.encre}" font-family="Nimbus Sans, DejaVu Sans, sans-serif" font-size="92" font-weight="700" letter-spacing="-2">RÉCUPÉRÉS ?</text>
      <text x="80" y="444" fill="#514F55" font-family="Nimbus Sans, DejaVu Sans, sans-serif" font-size="38">Saisi ≠ confisqué ≠ recouvré</text>
      <line x1="80" y1="510" x2="1120" y2="510" stroke="${couleurs.encre}" stroke-opacity="0.22" stroke-width="2"/>
      <text x="80" y="580" fill="${couleurs.bleu}" font-family="Nimbus Sans, DejaVu Sans, sans-serif" font-size="30" font-weight="700">610 dossiers sur 750 restent à l’instruction</text>
    </svg>
  `);
}

async function creerSocial() {
  const photo = await sharp(source)
    .rotate()
    .resize(1200, 630, { fit: 'cover', position: 'north', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.65, m1: 0.5, m2: 1.2 })
    .toBuffer();
  const logo = await sharp(logoSvg).resize(410, 103, { fit: 'contain' }).png().toBuffer();

  await sharp({
    create: { width: 1200, height: 1500, channels: 4, background: couleurs.papier },
  })
    .composite([
      { input: photo, top: 0, left: 0 },
      { input: filetTricolore(1200), top: 0, left: 0 },
      { input: texteSocial(), top: 630, left: 0 },
      { input: logo, top: 1320, left: 78 },
      { input: filetTricolore(1200), top: 1491, left: 0 },
    ])
    .webp({ quality: 88, effort: 6 })
    .toFile(path.join(socialDir, '061-pjf-100-milliards-recouvres.webp'));
}

await Promise.all([creerHero(), creerOg(), creerSocial()]);
console.log('Visuels du dossier 061 créés à partir de la photographie authentique.');
