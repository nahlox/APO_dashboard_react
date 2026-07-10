# Onboarding d'un nouveau client (huilerie)

Checklist pour ajouter une nouvelle usine de transformation d'huile sur la plateforme.

## 1. Créer le tenant (via l'app)

1. Se connecter avec un compte **super-admin** (voir `super_admins` en base).
2. Dans la sidebar → **Clients (Admin)**.
3. Remplir le formulaire :
   - **Identifiant technique** : slug unique (`huilerie_benin`), minuscules/chiffres/underscore.
   - **Nom affiché**, pays, plan.
   - **Couleurs** de marque (primaire/secondaire) — appliquées automatiquement dans toute l'UI.
   - **Expéditeur email** (optionnel) — sinon expéditeur par défaut de la plateforme.
   - **Destinataires des rapports**, capacité tank, dossiers Dropbox.
   - **Premier utilisateur** (email + rôle) — reçoit une invitation Supabase par email.
4. Valider → crée `tenants`, `tenant_config`, invite l'utilisateur, l'associe dans `user_tenants`.

Ça couvre : le schéma DB (`tenant_id` + RLS), l'auth, le branding dynamique de l'UI, et le
destinataire/expéditeur des rapports email.

## 2. Configurer l'ETL du client

L'edge function ne configure que le strict nécessaire côté DB. Il reste à compléter
`tenant_config.config` avec les détails propres au fichier source du client (patterns de
feuilles Excel, noms de fichiers, filtres de libellés à exclure) — copier la structure de la
config `apo` comme modèle (`SELECT config FROM tenant_config WHERE tenant_id = 'apo'`).

Utiliser **`etl_cloud.py`** (pas `etl.py`, qui reste réservé au tenant historique `apo` sur Mac
local) :

```bash
python etl_cloud.py --tenant huilerie_benin --dry   # simulation, vérifie le mapping
python etl_cloud.py --tenant huilerie_benin         # import réel
```

Prérequis : un token Dropbox (`DROPBOX_TOKEN`/`DROPBOX_REFRESH_TOKEN`) avec accès au dossier du
client. Programmer l'exécution récurrente (GitHub Actions, Railway, cron) — pas encore
automatisé par défaut pour les nouveaux clients, à mettre en place au cas par cas selon le volume
de clients onboardés.

## 3. Vérifications

- [ ] Le nouvel utilisateur reçoit bien l'email d'invitation Supabase et peut définir son mot de
      passe.
- [ ] Après connexion, le dashboard affiche le bon nom/couleurs (pas "APO").
- [ ] `etl_cloud.py --dry` ne remonte pas d'erreur de mapping de colonnes/feuilles.
- [ ] Un import réel crée des lignes avec le bon `tenant_id` (vérifier qu'aucune ligne d'un autre
      tenant n'apparaît — RLS + isolation).
- [ ] Le rapport quotidien (`weekly-report`) et la notification push (`daily-push`) fonctionnent
      pour ce tenant (tester avec `test_email` avant d'activer le cron).
- [ ] Si le client a son propre nom de domaine d'envoi email, le vérifier dans Resend et le
      renseigner dans `email_from`.

## 4. Cron (rapports automatiques)

Le cron actuel (`weekly_report_cron.sql`, `push_subscriptions_migration.sql`) ne couvre que le
tenant `apo`. Pour chaque nouveau client, ajouter un job `cron.schedule` équivalent avec son
`tenant_id`, ou faire évoluer le cron existant pour boucler sur tous les tenants actifs
(`SELECT id FROM tenants WHERE actif`) — recommandé dès qu'il y a 3+ clients actifs.

## Limites connues (à garder en tête)

- L'ETL cloud est fonctionnel mais pas encore branché à un scheduler out-of-the-box pour un
  nouveau client — à faire manuellement pour l'instant.
- Le logo du tenant (`tenants.logo_url`) doit être une URL publique (pas d'upload de fichier
  intégré) — héberger l'image (ex: Supabase Storage) puis coller l'URL dans le formulaire admin.
- Un seul domaine Vercel sert tous les tenants — pas de sous-domaine par client pour l'instant.
