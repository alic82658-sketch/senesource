import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Collection « dossiers » — modèle MULTI-TYPE (docs/architecture/05-contenu-mdx.md).
 * Le Dossier est l'objet éditorial principal ; il n'est PAS forcément un
 * fact-check : `affirmation` et `verdict` sont optionnels. Les garde-fous
 * ci-dessous cassent le build plutôt que de laisser passer une incohérence.
 *
 * Les cinq verdicts autorisés viennent du handoff (§4.1) — jamais d'autres.
 */

const VERDICTS = ['Exact', 'Exact, mais partiel', 'Trompeur', 'Faux', 'Invérifiable'] as const;

const consequence = z.object({
  profil: z.string(),
  chiffre: z.string(),
  qualification: z.string(),
  qualificationDesktop: z.string().optional(), // phrase sous le chiffre (§6.1/§6.2)
  hypothese: z.string().optional(),
  note: z.string().optional(),
  noteAccent: z.string().optional(),
  action: z.string().optional(),
});

const dossiers = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/dossiers' }),
  schema: z
    .object({
      numero: z.number().int().positive(),
      type: z.enum(['verification', 'impact', 'document', 'explication']),
      // Un titre de dossier est toujours une question, ≤ 140 caractères (§7)
      titre: z.string().max(140).refine((t) => t.trim().endsWith('?'), {
        message: 'Un titre de dossier est toujours une question (handoff §7).',
      }),
      // Variante resserrée du titre pour le hero desktop en display-1 (§6.1)
      titreCourt: z.string().max(140).optional(),
      rubrique: z.string(),
      statut: z.enum(['en_instruction', 'publie', 'archive']),
      ouvertLe: z.string().optional(),
      version: z.number().int().positive().optional(),
      misAJourLe: z.string().optional(),
      resume: z.string().optional(),

      affirmation: z
        .object({
          texte: z.string(),
          provenance: z.string().optional(),
          provenanceLongue: z.string().optional(),
        })
        .optional(),
      verdict: z
        .object({
          mot: z.enum(VERDICTS),
          resume: z.string(),
          resumeCourt: z.string().optional(),
        })
        .optional(),
      // Sans verdict : phrase d'attente + date du prochain point (§4.2 : obligatoires)
      instruction: z
        .object({ explication: z.string(), prochainPoint: z.string() })
        .optional(),

      // Preuves : liste unique, déclinée par gabarit.
      // `texte` (mobile, phrase complète) · `texteCourt` (colonnes desktop)
      preuves: z
        .array(
          z.object({
            texte: z.string(),
            texteCourt: z.string().optional(),
            etabli: z.boolean(),
            meta: z.string().optional(),
            mobile: z.boolean().default(true),
          }),
        )
        .default([]),
      nonEtabliMeta: z.string().optional(),
      // Points-clés de la homepage desktop (§6.1)
      pointsCles: z
        .array(z.object({ texte: z.string(), etabli: z.boolean().default(true) }))
        .default([]),

      // Registre des pièces : journal de collecte — jamais un score.
      pieces: z
        .array(
          z.object({
            n: z.number().int().positive(),
            titre: z.string(),
            titreCourt: z.string().optional(), // rail « Les n pièces » (§6.2)
            meta: z.string().optional(),
            obtenue: z.boolean(),
            rail: z.boolean().default(false),
          }),
        )
        .default([]),

      texteOfficiel: z
        .object({
          texte: z.string(),
          texteCourt: z.string().optional(),
          cote: z.string(),
          action: z.string().optional(),
          actionCourte: z.string().optional(),
        })
        .optional(),

      consequenceHome: consequence.optional(),
      consequenceDossier: consequence.optional(),
      // Conséquence absente : encart explicatif obligatoire — jamais de vide (§7)
      encartAbsence: z.object({ label: z.string(), texte: z.string() }).optional(),

      // Carte de dossier secondaire : chiffre-clé (§5.1/§6.1)
      chiffreCle: z
        .object({ valeur: z.string(), qualification: z.string() })
        .optional(),

      historique: z
        .array(z.object({ version: z.number().int(), date: z.string(), note: z.string() }))
        .default([]),

      // V0.1 : seuls les dossiers complets génèrent une page
      pageComplete: z.boolean().default(false),
    })
    .superRefine((d, ctx) => {
      if (d.verdict && !d.affirmation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Un verdict juge une affirmation : `affirmation` est requise.',
        });
      }
      if (d.verdict && d.type !== 'verification') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Un dossier de type « ${d.type} » ne porte pas de verdict (modèle multi-type).`,
        });
      }
      if (!d.verdict && d.statut === 'en_instruction' && !d.instruction && d.pieces.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Un dossier en instruction affiche sa collecte : `instruction` ou `pieces` requis (§4.2).',
        });
      }
      if (d.consequenceDossier && !d.consequenceDossier.hypothese) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Un chiffre-conséquence est toujours accompagné de son hypothèse (§7).',
        });
      }
    }),
});

export const collections = { dossiers };
