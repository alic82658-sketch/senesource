/**
 * @senesource/design-tokens — VALEURS du système visuel, transposables
 * web ↔ React Native. Source de vérité : le handoff Claude Design
 * (`design/handoff/`), transcrit ici sous forme neutre.
 *
 * Ce paquet partage des VALEURS, jamais du CSS ni des composants. La future
 * UI Expo sera une implémentation native distincte qui consommera ces mêmes
 * valeurs (couleurs, espacements, typographie conceptuelle, breakpoints).
 *
 * ⚠ A2 : ce paquet n'est PAS encore branché sur le build web. `apps/web`
 * conserve son `src/styles/tokens.css` (couche CSS inchangée, build
 * byte-identique). Générer `tokens.css` à partir d'ici est une étape
 * ultérieure (elle modifierait le build) — voir docs/architecture/10-rapport-a2.md.
 * En attendant, les deux représentent les mêmes valeurs ; `tokens.css` reste
 * la projection CSS, ce module la source neutre partagée.
 */

/** Palette fermée (handoff §1) + valeurs relevées dans les gabarits normatifs. */
export const couleurs = {
  paper: '#faf8f4',
  paper2: '#f2eee6',
  ink: '#17161a',
  ink90: '#2b2925',
  ink80: '#33312c',
  ink70: '#4a4741',
  ink60: '#57534b',
  mid: '#6b665d',
  hollow: '#a19a8d',
  rule: '#e0dbd1',
  ochre: '#a2621b',
  ochreInv: '#d9a25e',
  highlight: '#f6e3c4',
  puceBord: '#d8d2c7',
  // Écran inversé (formulaire, §5.6)
  invFilet: '#4d4a43',
  invLabel: '#a79e90',
  invTexte: '#b5ac9d',
  invNote: '#7d766b',
  // Page Document (§6.3) — seul emplacement où le blanc pur est autorisé
  docFond: '#efebe3',
  docPage: '#ffffff',
  docBord: '#dcd6cb',
  docMeta: '#8b8579',
  docFilet: '#ede8de',
} as const;

/** Familles typographiques (handoff §2) — piles de secours pour le web. */
export const familles = {
  serif: "'Newsreader', Georgia, 'Times New Roman', serif",
  sans: "'Public Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, 'Courier New', monospace",
} as const;

/** Graisses autorisées, aucune autre (handoff §7). */
export const graisses = { normal: 400, medium: 500, semibold: 600 } as const;

/**
 * Échelle typographique nommée par usage (handoff §2). Tailles/interlignes en
 * px, tracking en em. `mobile`/`desktop` quand le cran varie au breakpoint.
 * Valeurs conceptuelles : le web les projette en CSS, l'app en styles natifs.
 */
export const typo = {
  display: {
    famille: 'serif',
    graisse: 400,
    mobile: { taille: 29, interligne: 1.14, tracking: -0.015 },
    desktop: { taille: 54, interligne: 1.06, tracking: -0.02 },
  },
  titre: {
    famille: 'serif',
    graisse: 400,
    mobile: { taille: 21, interligne: 1.2, tracking: -0.01 },
    desktop: { taille: 23, interligne: 1.16, tracking: -0.01 },
  },
  citation: { famille: 'serif', graisse: 400, italique: true, taille: 19, interligne: 1.35, tracking: 0 },
  verdict: {
    famille: 'serif',
    graisse: 400,
    italique: true,
    mobile: { taille: 28, interligne: 1 },
    desktop: { taille: 24, interligne: 1 },
  },
  chiffre: {
    famille: 'serif',
    graisse: 400,
    couleur: 'ochre',
    encart: { taille: 42, interligne: 0.88 },
    page: { taille: 52, interligne: 0.9 },
  },
  corps: {
    famille: 'sans',
    graisse: 400,
    mobile: { taille: 15.5, interligne: 1.62 },
    desktop: { taille: 16.5, interligne: 1.65 },
  },
  corps2: { famille: 'sans', graisse: 400, taille: 13.5, interligne: 1.55 },
  label: { famille: 'mono', graisse: 500, taille: 10, interligne: 1, tracking: 0.09, capitales: true },
  meta: { famille: 'mono', graisse: 400, taille: 9.5, interligne: 1.5, tracking: 0.06, capitales: true },
} as const;

/**
 * Espacements structurants (handoff §3). Base 2px, pas usuel 4px ;
 * pile verticale = crans autorisés.
 */
export const espacement = {
  base: 2,
  pas: 4,
  pileVerticale: [8, 10, 12, 14, 16, 18, 22, 26, 32, 34],
  gouttiereMobile: 20,
  margeDesktop: 48,
  margeDesktopXl: 64,
  zoneTactileMin: 44,
} as const;

/** Filets (handoff §3) : fin (--rule, même niveau) / fort (--ink, entre niveaux). */
export const filets = { epaisseur: 1 } as const;

/** Structure de mise en page (handoff §3). */
export const structure = {
  rail: 380,
  railXl: 400,
  texteMax: 700, // px
  corpsMax: '70ch',
  titreMaxDesktop: '15ch',
} as const;

/** Breakpoints (handoff §3). */
export const breakpoints = { sm: 640, lg: 1024, xl: 1440 } as const;

/** Interactions (handoff §4.9) : opacité et couleur de bordure uniquement. */
export const interactions = { transitionMs: 120, transitionEase: 'linear' } as const;
