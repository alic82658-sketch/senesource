import type { StructureResolver } from 'sanity/structure';

const mediaFilter = (media: string) => `_type == "editorialItem" && media == "${media}"`;
const statusFilter = (status: string) => `_type == "editorialItem" && statut == "${status}"`;

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Rédaction')
    .items([
      S.listItem()
        .title('Radar')
        .child(S.documentTypeList('editorialItem').title('Radar').filter(statusFilter('radar'))),
      S.listItem()
        .title('À valider')
        .child(S.documentTypeList('editorialItem').title('À valider').filter(statusFilter('a_valider'))),
      S.listItem()
        .title('Publiés')
        .child(S.documentTypeList('editorialItem').title('Publiés').filter(statusFilter('publie'))),
      S.divider(),
      S.listItem()
        .title('SeneSource')
        .child(S.documentTypeList('editorialItem').title('SeneSource').filter(mediaFilter('senesource'))),
      S.listItem()
        .title('XamXam')
        .child(S.documentTypeList('editorialItem').title('XamXam').filter(mediaFilter('xamxam'))),
      S.listItem()
        .title('Lions')
        .child(S.documentTypeList('editorialItem').title('Lions').filter(mediaFilter('lions'))),
      S.divider(),
      S.listItem()
        .title('Sources')
        .child(S.documentTypeList('editorialSource').title('Sources')),
      S.listItem()
        .title('Tous les sujets')
        .child(S.documentTypeList('editorialItem').title('Tous les sujets')),
      S.divider(),
      S.listItem()
        .title('SeneSource · dossiers publiés')
        .child(S.documentTypeList('dossier').title('Publiés').filter('_type == "dossier" && statut == "publie"')),
      S.listItem()
        .title('SeneSource · en instruction')
        .child(S.documentTypeList('dossier').title('En instruction').filter('_type == "dossier" && statut == "en_instruction"')),
      S.listItem()
        .title('SeneSource · archives')
        .child(S.documentTypeList('dossier').title('Archivés').filter('_type == "dossier" && statut == "archive"')),
      S.listItem()
        .title('SeneSource · documents')
        .child(S.documentTypeList('documentSource').title('Documents')),
    ]);
