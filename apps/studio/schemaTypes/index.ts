import { dossier } from './dossier';
import { document, extraitDocument } from './document';
import { illustration } from './illustration';
import { objectTypes } from './objects';

/**
 * Types du Studio SeneSource : deux documents (`dossier`, `document`) + leurs
 * sous-objets, miroir de `@senesource/domain`. `document` est réutilisable
 * entre dossiers ; une pièce le référence. Pas d'entité `Organisation`
 * (l'émetteur reste une chaîne — V1).
 */
export const schemaTypes = [dossier, document, extraitDocument, illustration, ...objectTypes];
