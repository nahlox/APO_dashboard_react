# Présentation business Palmeo

`../Palmeo-presentation-business.pptx` — 19 slides, en français, présentation de la
plateforme du point de vue business (problème, valeur, produit, modèle, avancement).

## Régénérer le fichier

Le `.pptx` est entièrement généré par `build.js` — **ne pas éditer le PowerPoint à la
main** si l'intention est de le maintenir : modifier le script, puis régénérer.

```bash
cd docs/presentation
npm install pptxgenjs        # seule dépendance
node build.js                # écrit Palmeo-presentation-business.pptx dans le dossier courant
```

Puis déplacer le fichier dans `docs/`.

## Sources des chiffres

| Slide | Origine |
|---|---|
| 3 · « 8 fichiers Excel » | en-tête de `apo-dashboard/src/db/schema.sql` |
| 5 · modules | `apo-dashboard/src/components/layout/Sidebar.jsx` |
| 6 à 12 · KPI, graphiques, P&L | jeu de **démonstration anonymisé** de `docs/video-palmeo-60s.md` (« Huilerie Sédia ») — aucune donnée client réelle |
| 9 · barème du taux d'extraction | prompt système de `supabase/functions/chatbot/index.ts` |
| 10 · quota 60 messages / jour | `DAILY_LIMIT` dans `supabase/functions/chatbot/index.ts` |
| 13 · 12 sources, 3 offres | `palmeo-landing/src/App.jsx` (`LOGOS`, `MODELS`) |
| 14 à 16 · multi-tenant, console | `supabase/migrations/`, `apo-dashboard/src/admin/` |
| 15 · parcours d'accueil | `ONBOARDING.md` |
| 17 · avancement et limites | `ONBOARDING.md` § « Limites connues » + `docs/video-palmeo-60s.md` § 2 |
| 18 · paliers starter/business/enterprise | contrainte `CHECK` de `tenants.plan` (`migration_multitenant.sql`) |

Aucun prix n'est affiché : la grille tarifaire n'existe nulle part dans le dépôt.

## Notes de présentation

Chaque slide porte des notes (`slide.addNotes`) destinées à l'orateur — visibles dans
le mode Présentateur de PowerPoint, pas à l'écran.
