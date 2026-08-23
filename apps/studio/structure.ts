import type { StructureResolver } from 'sanity/structure';

/**
 * Desk : les dossiers groupés par statut, pour qu'une petite rédaction voie
 * d'un coup d'œil ce qui est publié, en instruction, ou archivé. Un seul type
 * de document — pas d'arborescence inutile.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('SeneSource')
    .items([
      S.listItem()
        .title('Dossiers · publiés')
        .child(S.documentTypeList('dossier').title('Publiés').filter('_type == "dossier" && statut == "publie"')),
      S.listItem()
        .title('Dossiers · en instruction')
        .child(S.documentTypeList('dossier').title('En instruction').filter('_type == "dossier" && statut == "en_instruction"')),
      S.listItem()
        .title('Dossiers · archivés')
        .child(S.documentTypeList('dossier').title('Archivés').filter('_type == "dossier" && statut == "archive"')),
      S.divider(),
      S.listItem().title('Tous les dossiers').child(S.documentTypeList('dossier').title('Tous les dossiers')),
      S.divider(),
      S.listItem().title('Documents').child(S.documentTypeList('documentSource').title('Documents')),
    ]);
