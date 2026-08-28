/**
 * Génère les images d'aperçu (Open Graph) des articles et du site — INVISIBLES.
 *
 * Pourquoi : WhatsApp (canal de distribution principal) n'affiche pas d'aperçu
 * pour les illustrations SVG. On produit donc, pour chaque article publié, une
 * conversion PNG ~1200×630 de son illustration, réservée à og:image. Sans
 * retouche : recadrage « cover » centré uniquement.
 *
 * Les fichiers générés sont écrits dans public/og/ et versionnés (actifs
 * statiques). Rejouer ce script après avoir ajouté/changé une illustration :
 *   node apps/web/scripts/generer-og.mjs
 */
import { createRequire } from 'node:module';
import {
  readdirSync,
  readFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const racine = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const monorepoRacine = path.resolve(racine, '..', '..');

// sharp est une dépendance transitive d'Astro, rangée dans le store pnpm.
function chargerSharp() {
  try {
    return require('sharp');
  } catch {
    const pnpm = path.join(monorepoRacine, 'node_modules', '.pnpm');
    const dir = readdirSync(pnpm).find((d) => /^sharp@/.test(d));
    if (!dir) throw new Error('sharp introuvable dans le store pnpm.');
    return require(path.join(pnpm, dir, 'node_modules', 'sharp'));
  }
}
const sharp = chargerSharp();

const dossiersDir = path.join(racine, 'src', 'content', 'dossiers');
const publicDir = path.join(racine, 'public');
const illustrationsDir = path.join(publicDir, 'illustrations');
const ogDir = path.join(publicDir, 'og');
mkdirSync(ogDir, { recursive: true });

const LARGEUR = 1200;
const HAUTEUR = 630;
const PAPIER = { r: 253, g: 253, b: 252, alpha: 1 }; // --ss-paper #fdfdfc

/** Extrait un champ simple `clef: valeur` du frontmatter (guillemets tolérés). */
function champ(texte, clef) {
  const m = new RegExp(`^${clef}:\\s*"?([^"\\n]+)"?\\s*$`, 'm').exec(texte);
  return m ? m[1].trim() : undefined;
}

/** src de l'illustration : `illustration:` puis `  src: "..."`. */
function illustrationSrc(texte) {
  const bloc = /illustration:\s*\n([\s\S]*?)(?:\n\S|\n---|$)/.exec(texte);
  if (!bloc) return undefined;
  const m = /^\s+src:\s*"?([^"\n]+)"?/m.exec(bloc[1]);
  return m ? m[1].trim() : undefined;
}

async function versOg(sourceAbs, sortieAbs) {
  const estSvg = sourceAbs.toLowerCase().endsWith('.svg');
  await sharp(sourceAbs, estSvg ? { density: 220 } : {})
    .resize(LARGEUR, HAUTEUR, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(sortieAbs);
}

let compteur = 0;

// 1) Un PNG d'aperçu par article publié disposant d'une illustration.
for (const fichier of readdirSync(dossiersDir).filter((f) => f.endsWith('.mdx'))) {
  const texte = readFileSync(path.join(dossiersDir, fichier), 'utf8');
  const statut = champ(texte, 'statut');
  const pageComplete = champ(texte, 'pageComplete');
  const src = illustrationSrc(texte);
  if (statut !== 'publie' || pageComplete !== 'true' || !src) continue;

  const slug = fichier.replace(/\.mdx$/, '');
  const sourceAbs = path.join(publicDir, src.replace(/^\//, ''));
  if (!existsSync(sourceAbs)) {
    console.warn(`⚠ illustration absente pour ${slug} : ${src}`);
    continue;
  }
  const sortie = path.join(ogDir, `${slug}.png`);
  await versOg(sourceAbs, sortie);
  console.log(`✓ og/${slug}.png ← ${src}`);
  compteur++;
}

// 2) Logo raster (publisher.logo du JSON-LD) — 512×128, sur fond papier.
const logoSvg = path.join(publicDir, 'logo-senesource.svg');
await sharp(logoSvg, { density: 300 })
  .resize(512, 128, { fit: 'contain', background: PAPIER })
  .flatten({ background: PAPIER })
  .png()
  .toFile(path.join(ogDir, 'logo.png'));
console.log('✓ og/logo.png');

// 3) Image d'aperçu par défaut (pages sans illustration) — logo centré 1200×630.
const logoBuffer = await sharp(logoSvg, { density: 300 })
  .resize(760, 190, { fit: 'contain', background: PAPIER })
  .png()
  .toBuffer();
await sharp({
  create: { width: LARGEUR, height: HAUTEUR, channels: 4, background: PAPIER },
})
  .composite([{ input: logoBuffer, gravity: 'centre' }])
  .png()
  .toFile(path.join(ogDir, 'default.png'));
console.log('✓ og/default.png');

console.log(`\nTerminé : ${compteur} aperçu(s) d'article + logo + défaut.`);
