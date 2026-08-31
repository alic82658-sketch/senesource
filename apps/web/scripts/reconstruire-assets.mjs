import { readFile, writeFile, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const webRoot = join(ici, '..');

const assets = [
  {
    source: join(webRoot, 'public', 'illustrations', '049-oignon-hausse-prix-sac-hd.webp.b64'),
    destination: join(webRoot, 'public', 'illustrations', '049-oignon-hausse-prix-sac-hd.webp'),
  },
];

for (const asset of assets) {
  try {
    const base64 = await readFile(asset.source, 'utf8');
    await writeFile(asset.destination, Buffer.from(base64.trim(), 'base64'));
    await unlink(asset.source);
    console.log(`Asset reconstruit: ${asset.destination}`);
  } catch (erreur) {
    if (erreur?.code !== 'ENOENT') throw erreur;
  }
}
