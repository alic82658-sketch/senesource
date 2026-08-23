import { dossier } from './dossier';
import { objectTypes } from './objects';

/**
 * Types du Studio SeneSource. Un seul document (`dossier`) + ses sous-objets,
 * miroir de `@senesource/domain`. Pas d'entité `Document` ni `Organisation`
 * autonome : elles n'existent pas dans le domaine actuel (voir rapport B1).
 */
export const schemaTypes = [dossier, ...objectTypes];
