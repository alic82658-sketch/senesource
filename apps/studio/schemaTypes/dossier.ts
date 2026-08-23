/**
 * Document `dossier` — miroir EXACT de `@senesource/domain` (DossierChamps + slug).
 *
 * Le schéma s'adapte au domaine. Les validations croisées reproduisent les
 * invariants du domaine (ex-superRefine de content.config.ts) SANS gêner la
 * publication rapide : seuls les champs vraiment indispensables sont requis,
 * le reste est regroupé et repliable.
 *
 * Publier vite = numéro + type + titre + rubrique + statut + slug. Tout le
 * reste (verdict, pièces, conséquences, historique…) est facultatif et
 * s'ajoute au fil de l'enquête.
 */
import { defineField, defineType } from 'sanity';
import { TYPES_DOSSIER, STATUTS_DOSSIER } from '@senesource/domain';

const API = '2024-01-01';

/** Prochain numéro public disponible = max(numero) + 1. */
async function prochainNumero(getClient: (o: { apiVersion: string }) => { fetch: (q: string) => Promise<number | null> }): Promise<number> {
  const client = getClient({ apiVersion: API });
  const max = await client.fetch('*[_type == "dossier" && defined(numero)] | order(numero desc)[0].numero');
  return (max ?? 0) + 1;
}

export const dossier = defineType({
  name: 'dossier',
  title: 'Dossier',
  type: 'document',
  groups: [
    { name: 'essentiel', title: 'Essentiel', default: true },
    { name: 'verdict', title: 'Affirmation & verdict' },
    { name: 'preuves', title: 'Preuves & pièces' },
    { name: 'consequences', title: 'Conséquences' },
    { name: 'affichage', title: 'Affichage & carte' },
    { name: 'suivi', title: 'Historique & suivi' },
  ],
  fields: [
    // ---------- Essentiel ----------
    // SAISI par l'éditeur : titre, rubrique. AUTO : numero (proposé), type
    // (prérempli), statut (prérempli), slug (généré depuis numéro + titre).
    defineField({
      name: 'titre',
      title: 'Titre (toujours une question) — SAISI',
      type: 'string',
      group: 'essentiel',
      validation: (r) =>
        r
          .required()
          .max(140)
          .custom((t) => (typeof t === 'string' && !t.trim().endsWith('?') ? 'Un titre de dossier est toujours une question (handoff §7).' : true)),
    }),
    defineField({
      name: 'rubrique',
      title: 'Rubrique — SAISIE',
      type: 'string',
      group: 'essentiel',
      validation: (r) => r.required(),
      description: 'Ex. « Fiscalité · Carburant ».',
    }),
    defineField({
      name: 'numero',
      title: 'Numéro de dossier — proposé automatiquement',
      type: 'number',
      group: 'essentiel',
      // Auto : prochain numéro disponible ; corrigeable manuellement si besoin.
      initialValue: (_props, context) => prochainNumero(context.getClient),
      validation: (r) =>
        r
          .required()
          .integer()
          .positive()
          .custom(async (numero, context) => {
            if (numero == null) return true;
            const id = (context.document?._id ?? '').replace(/^drafts\./, '');
            const client = context.getClient({ apiVersion: API });
            const doublons: number = await client.fetch(
              'count(*[_type == "dossier" && numero == $n && !(_id in [$id, "drafts." + $id])])',
              { n: numero, id },
            );
            return doublons > 0 ? `Le numéro ${numero} est déjà utilisé par un autre dossier.` : true;
          }),
      description: 'Identité publique (≠ _id technique). Proposé = max + 1 ; l’éditeur peut corriger. Unicité vérifiée.',
    }),
    defineField({
      name: 'type',
      title: 'Type de dossier — prérempli',
      type: 'string',
      group: 'essentiel',
      options: { list: TYPES_DOSSIER.map((t) => ({ title: t, value: t })), layout: 'radio' },
      initialValue: 'verification',
      validation: (r) => r.required(),
      description: 'Un dossier n’est pas forcément un fact-check.',
    }),
    defineField({
      name: 'statut',
      title: 'Statut — prérempli « en instruction »',
      type: 'string',
      group: 'essentiel',
      options: { list: STATUTS_DOSSIER.map((s) => ({ title: s, value: s })), layout: 'radio' },
      initialValue: 'en_instruction',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL) — généré',
      type: 'slug',
      group: 'essentiel',
      options: {
        source: (doc) => {
          const n = typeof doc.numero === 'number' ? String(doc.numero).padStart(3, '0') : '';
          const t = typeof doc.titre === 'string' ? doc.titre : '';
          return `${n} ${t}`;
        },
        maxLength: 96,
      },
      validation: (r) => r.required(),
      description: 'Porte l’URL /dossier/{slug} (numéro + titre). Immuable après publication (convention éditoriale).',
    }),
    defineField({ name: 'titreCourt', title: 'Titre court (hero desktop)', type: 'string', group: 'essentiel', validation: (r) => r.max(140) }),
    defineField({ name: 'resume', title: 'Résumé (chapô)', type: 'text', rows: 2, group: 'essentiel' }),

    // ---------- Affirmation & verdict ----------
    defineField({ name: 'affirmation', title: 'Affirmation', type: 'affirmation', group: 'verdict' }),
    defineField({
      name: 'verdict',
      title: 'Verdict (optionnel)',
      type: 'verdictRendu',
      group: 'verdict',
      // Invariants du domaine : verdict ⇒ affirmation ; verdict ⇒ type = verification.
      validation: (r) =>
        r.custom((verdict, ctx) => {
          const doc = ctx.document as { affirmation?: unknown; type?: string } | undefined;
          if (!verdict) return true;
          if (!doc?.affirmation) return 'Un verdict juge une affirmation : renseignez l’affirmation.';
          if (doc?.type !== 'verification') return 'Seul un dossier de type « verification » porte un verdict.';
          return true;
        }),
    }),
    defineField({
      name: 'instruction',
      title: 'En instruction (si pas de verdict)',
      type: 'instruction',
      group: 'verdict',
      description: 'Phrase d’attente + date du prochain point, quand aucun verdict n’est encore rendu.',
    }),

    // ---------- Preuves & pièces ----------
    defineField({ name: 'preuves', title: 'Preuves', type: 'array', of: [{ type: 'preuve' }], group: 'preuves' }),
    defineField({ name: 'nonEtabliMeta', title: 'Métadonnée « non établi »', type: 'string', group: 'preuves' }),
    defineField({ name: 'pointsCles', title: 'Points-clés (homepage desktop)', type: 'array', of: [{ type: 'pointCle' }], group: 'preuves' }),
    defineField({ name: 'pieces', title: 'Registre des pièces', type: 'array', of: [{ type: 'piece' }], group: 'preuves' }),
    defineField({ name: 'texteOfficiel', title: 'Texte officiel cité', type: 'texteOfficiel', group: 'preuves' }),

    // ---------- Conséquences ----------
    defineField({ name: 'consequenceHome', title: 'Conséquence (encart homepage)', type: 'consequence', group: 'consequences' }),
    defineField({
      name: 'consequenceDossier',
      title: 'Conséquence (page dossier)',
      type: 'consequence',
      group: 'consequences',
      // Invariant : un chiffre-conséquence de dossier a toujours son hypothèse.
      validation: (r) =>
        r.custom((c) => {
          const cons = c as { hypothese?: string } | undefined;
          if (cons && !cons.hypothese) return 'Un chiffre-conséquence est toujours accompagné de son hypothèse (§7).';
          return true;
        }),
    }),
    defineField({ name: 'encartAbsence', title: 'Encart « pourquoi pas de chiffre »', type: 'encartAbsence', group: 'consequences' }),

    // ---------- Affichage & carte ----------
    defineField({ name: 'chiffreCle', title: 'Chiffre-clé (carte secondaire)', type: 'chiffreCle', group: 'affichage' }),
    defineField({ name: 'ouvertLe', title: 'Ouvert le', type: 'date', options: { dateFormat: 'YYYY-MM-DD' }, group: 'affichage', description: 'Date ISO ; l’affichage « 18.08 » est produit par packages/editorial.' }),
    defineField({ name: 'version', title: 'Version', type: 'number', group: 'affichage', validation: (r) => r.integer().positive() }),
    defineField({ name: 'misAJourLe', title: 'Mis à jour le', type: 'date', options: { dateFormat: 'YYYY-MM-DD' }, group: 'affichage', description: 'Date ISO ; l’affichage est produit par packages/editorial.' }),
    defineField({
      name: 'pageComplete',
      title: 'Page complète (génère une page dédiée)',
      type: 'boolean',
      group: 'affichage',
      initialValue: false,
      description: 'V0.1 : seuls les dossiers complets ont leur page.',
    }),

    // ---------- Historique & suivi ----------
    defineField({ name: 'historique', title: 'Historique de publication', type: 'array', of: [{ type: 'entreeHistorique' }], group: 'suivi' }),
  ],
  // Invariant : un dossier « en instruction » sans verdict doit montrer sa
  // collecte (bloc instruction OU pièces).
  validation: (r) =>
    r.custom((doc) => {
      const d = doc as { statut?: string; verdict?: unknown; instruction?: unknown; pieces?: unknown[] } | undefined;
      if (d?.statut === 'en_instruction' && !d?.verdict && !d?.instruction && (!d?.pieces || d.pieces.length === 0)) {
        return 'Un dossier en instruction affiche sa collecte : renseignez « en instruction » ou au moins une pièce.';
      }
      return true;
    }),
  preview: {
    select: { numero: 'numero', titre: 'titre', statut: 'statut', mot: 'verdict.mot' },
    prepare: ({ numero, titre, statut, mot }) => ({
      title: `Dossier ${typeof numero === 'number' ? String(numero).padStart(3, '0') : '—'} · ${titre ?? ''}`,
      subtitle: mot ? `Verdict : ${mot}` : statut === 'en_instruction' ? 'En instruction' : (statut ?? ''),
    }),
  },
});
