import { dossier } from './dossier';
import { document, extraitDocument } from './document';
import { illustration } from './illustration';
import { objectTypes } from './objects';
import { editorialItem } from './editorialItem';
import { editorialSource } from './editorialSource';

/**
 * Le Studio conserve les types SeneSource existants et ajoute une couche
 * éditoriale transverse destinée à piloter plusieurs médias depuis une seule
 * rédaction : SeneSource, XamXam et Lions.
 */
export const schemaTypes = [
  dossier,
  document,
  extraitDocument,
  illustration,
  editorialItem,
  editorialSource,
  ...objectTypes,
];
