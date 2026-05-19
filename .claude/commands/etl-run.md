# /etl-run — Lancer l'ETL manuellement

Lance le pipeline ETL cloud et résume les résultats.

## Étapes

1. **Sync du code**
```bash
cd /Users/rnahle/projects/APO_dashboard_react && git pull origin main
```

2. **Lancer l'ETL**
```bash
cd /Users/rnahle/projects/APO_dashboard_react/apo-dashboard/src/db/etl && python3 etl_cloud.py
```

3. **Résumer la sortie** — rapporter :
   - KB téléchargés par fichier Dropbox
   - Lignes insérées par table et par mois
   - KPIs recalculés (`✅ KPIs mois X — CA : ... | Résultat : ...`)
   - Avertissements `⚠️` (onglets manquants — normal si mois sans données)
   - Erreurs `❌` (problèmes Supabase ou Dropbox)

4. **Si ETL OK → commit et push**
```bash
cd /Users/rnahle/projects/APO_dashboard_react && git add -A && git commit -m "ETL manuel $(date +'%Y-%m-%d') — Supabase mis à jour" && git push origin main
```

## En cas d'erreur

| Erreur | Action |
|--------|--------|
| `502 Cloudflare` / timeout | Relancer avec `python3 etl_cloud.py --mois 4` (un mois à la fois) |
| `AuthError` Dropbox | Le token a expiré — demander à l'utilisateur de régénérer sur dropbox.com/developers/apps |
| Fichier Dropbox introuvable | Vérifier le nom exact du fichier dans Dropbox (renommage fréquent) |

## Succès attendu
```
ETL Cloud terminé ✅
```
Sans aucune ligne `❌` dans la sortie.
