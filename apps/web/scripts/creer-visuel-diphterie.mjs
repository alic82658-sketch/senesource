/** Infographie exacte, rendue avec Sharp. Installer localement les polices du site
 * (Newsreader, Public Sans, IBM Plex Mono) avant de régénérer.
 * node apps/web/scripts/creer-visuel-diphterie.mjs
 */
import {readFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const req=createRequire(path.join(web,'package.json'));
const store=path.resolve(web,'../../node_modules/.pnpm');
const sharp=req(path.join(store,readdirSync(store).find(n=>/^sharp@/.test(n)),'node_modules/sharp'));
const logo=readFileSync(path.join(web,'public/logo-senesource.svg'),'utf8').replace('<svg ','<svg x="800" y="539" width="290" height="73" ');
const text=(x,y,size,t,f='Public Sans',color='#17161a',extra='')=>`<text x="${x}" y="${y}" font-family="${f}" font-size="${size}" fill="${color}" ${extra}>${t}</text>`;
const content=`<rect width="1200" height="675" fill="#fdfdfc"/>
${text(100,74,18,'SANTÉ','IBM Plex Mono','#a2621b','letter-spacing="2"')}
${text(1100,74,17,'SÉNÉGAL','IBM Plex Mono','#6b665d','text-anchor="end"')}
<path d="M100 96H1100" stroke="#e0dbd1"/>
${text(98,176,64,'Diphtérie :','Newsreader 16pt')}
${text(98,241,64,'le bilan a doublé','Newsreader 16pt')}
${text(100,286,21,'Cas confirmés cumulés','Public Sans','#57534b')}
${text(100,345,21,'20 septembre')}${text(100,371,17,'2026','IBM Plex Mono','#6b665d')}
<rect x="310" y="324" width="${540*114/248}" height="50" fill="#e0dbd1"/>
${text(310+540*114/248+23,367,49,'114','Newsreader 16pt')}
${text(100,434,21,'4 octobre')}${text(100,460,17,'2026','IBM Plex Mono','#6b665d')}
<rect x="310" y="413" width="540" height="50" fill="#a2621b"/>
${text(873,456,49,'248','Newsreader 16pt','#a2621b')}
${text(100,509,18,'Les bilans ne datent pas les contaminations.','Public Sans','#57534b')}
<path d="M100 536H1100" stroke="#e0dbd1"/>
${text(100,570,13,'Données du ministère','IBM Plex Mono','#6b665d')}
${text(100,593,13,'Sources : APS / APA','IBM Plex Mono','#6b665d')}${logo}`;
for(const t of [
{p:'illustrations/062-diphterie-bilans-octobre-2026.webp',w:1600,h:900},
{p:'og/062-diphterie-bilans-octobre-2026.jpg',w:1200,h:630},
{p:'social/062-diphterie-bilans-octobre-2026.webp',w:1080,h:1350}]){
 const isSocial=t.h>1000;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${isSocial?1080:1200}" height="${isSocial?1350:675}" viewBox="${isSocial?'0 0 1080 1350':'0 0 1200 675'}"><rect width="100%" height="100%" fill="#fdfdfc"/>${isSocial?'<g transform="translate(0 320) scale(.9)">':''}${content}${isSocial?'</g>':''}</svg>`;
 let p=sharp(Buffer.from(svg),{density:144}).resize(t.w,t.h,{fit:'cover'});
 p=t.p.endsWith('.jpg')?p.jpeg({quality:90,mozjpeg:true}):p.webp({quality:90,effort:6});
 const out=path.join(web,'public',t.p);mkdirSync(path.dirname(out),{recursive:true});await p.toFile(out);console.log(t.p);
}
