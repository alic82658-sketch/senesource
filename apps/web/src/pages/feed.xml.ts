import type { APIRoute } from 'astro';
import { dossiersAvecPage } from '../lib/contenu';
import { SITE_NOM, SITE_DESCRIPTION } from '../lib/jsonld';

/** Flux RSS des articles publiés (invisible) : titre, description, date, lien. */
function echapper(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** ISO `YYYY-MM-DD` → date RFC-822 (le Sénégal est à l'heure GMT). */
function rfc822(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T08:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d.toUTCString();
}

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://senesource.com');
  const abs = (chemin: string) => new URL(chemin, base).href;

  const articles = await dossiersAvecPage();

  const items = articles
    .map((d) => {
      const lien = abs(`/article/${d.slug}/`);
      const desc = d.resume ?? d.verdict?.resumeCourt ?? d.titre;
      const pub = rfc822(d.ouvertLe ?? d.misAJourLe);
      return [
        '    <item>',
        `      <title>${echapper(d.titre)}</title>`,
        `      <link>${lien}</link>`,
        `      <guid isPermaLink="true">${lien}</guid>`,
        `      <description>${echapper(desc)}</description>`,
        pub ? `      <pubDate>${pub}</pubDate>` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${echapper(SITE_NOM)}</title>
    <link>${abs('/')}</link>
    <atom:link href="${abs('/feed.xml')}" rel="self" type="application/rss+xml" />
    <description>${echapper(SITE_DESCRIPTION)}</description>
    <language>fr</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
