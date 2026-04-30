"""
Création de la table amortissement_bancaire et insertion des données Jan–Avr 2026.
Exécuter : python3 migrate_amortissement.py

Connexion directe PostgreSQL (psycopg2) — DDL non supporté via PostgREST.
"""

import os, sys
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DB_HOST     = os.getenv('DB_HOST', 'db.iwfgvhenqzdutjcxhuip.supabase.co')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_USER     = 'postgres'
DB_NAME     = 'postgres'
DB_PORT     = 5432

if not DB_PASSWORD:
    sys.exit("❌  DB_PASSWORD manquant dans .env")

conn = psycopg2.connect(
    host=DB_HOST, port=DB_PORT,
    user=DB_USER, password=DB_PASSWORD,
    dbname=DB_NAME, sslmode='require',
)
conn.autocommit = True
cur = conn.cursor()

# ── 1. Créer la table ────────────────────────────────────────────────────────
print("📦  Création table amortissement_bancaire …")
cur.execute("""
CREATE TABLE IF NOT EXISTS amortissement_bancaire (
    id          SERIAL PRIMARY KEY,
    periode_id  INTEGER NOT NULL REFERENCES periodes(id) ON DELETE CASCADE,
    libelle     TEXT    NOT NULL DEFAULT 'Amortissement prêt bancaire',
    montant_fcfa BIGINT NOT NULL,
    type        TEXT    NOT NULL DEFAULT 'annuite'
                CHECK (type IN ('annuite', 'principal', 'interet', 'autre'))
);
CREATE INDEX IF NOT EXISTS idx_amort_periode ON amortissement_bancaire(periode_id);
""")
print("  ✅  Table créée (ou déjà existante).")

# ── 2. Récupérer les periode_id Jan–Avr 2026 ─────────────────────────────────
cur.execute("""
    SELECT id, mois, libelle
    FROM   periodes
    WHERE  annee = 2026 AND mois BETWEEN 1 AND 4
    ORDER  BY mois
""")
periodes = cur.fetchall()
if not periodes:
    sys.exit("❌  Aucune période trouvée pour 2026 mois 1–4. Vérifiez la table periodes.")

print(f"\n📅  Périodes trouvées :")
for pid, mois, lib in periodes:
    print(f"  id={pid}  mois={mois}  libelle={lib}")

MONTANT = 20_200_000   # 20,2 M FCFA — annuité fixe mensuelle prêt bancaire

# ── 3. Insérer une ligne par période (idempotent) ────────────────────────────
print(f"\n💾  Insertion des annuités ({MONTANT:,} FCFA/mois) …")
for pid, mois, lib in periodes:
    cur.execute("SELECT COUNT(*) FROM amortissement_bancaire WHERE periode_id = %s", (pid,))
    if cur.fetchone()[0] > 0:
        print(f"  ⏭  Période {lib} (id={pid}) : déjà présente, ignorée.")
        continue
    cur.execute("""
        INSERT INTO amortissement_bancaire (periode_id, libelle, montant_fcfa, type)
        VALUES (%s, %s, %s, 'annuite')
    """, (pid, 'Amortissement prêt bancaire', MONTANT))
    print(f"  ✅  Période {lib} (id={pid}) : {MONTANT:,} FCFA insérés.")

# ── 4. Mettre à jour kpis_mensuels.amortissement_fcfa pour Avr 2026 (id=4) ──
print("\n🔄  Mise à jour kpis_mensuels.amortissement_fcfa pour Avril 2026 …")
# Trouver la periode_id d'Avril
avril_id = next((pid for pid, mois, _ in periodes if mois == 4), None)
if avril_id:
    cur.execute("""
        UPDATE kpis_mensuels
        SET    amortissement_fcfa = %s
        WHERE  periode_id = %s
    """, (MONTANT, avril_id))
    print(f"  ✅  kpis_mensuels mis à jour (periode_id={avril_id}, amortissement_fcfa={MONTANT:,}).")
else:
    print("  ⚠️  Avril 2026 non trouvé dans les périodes — kpis_mensuels non mis à jour.")

# ── 5. Vérification finale ────────────────────────────────────────────────────
cur.execute("""
    SELECT p.libelle, p.mois, a.libelle, a.montant_fcfa, a.type
    FROM   amortissement_bancaire a
    JOIN   periodes p ON p.id = a.periode_id
    WHERE  p.annee = 2026
    ORDER  BY p.mois
""")
rows = cur.fetchall()
print("\n📊  État de la table amortissement_bancaire (2026) :")
print(f"  {'Période':<20} {'Mois':>5}  {'Libellé':<35}  {'Montant (FCFA)':>15}  Type")
print("  " + "-" * 90)
for lib_p, mois, lib_a, mt, tp in rows:
    print(f"  {lib_p:<20} {mois:>5}  {lib_a:<35}  {mt:>15,}  {tp}")

cur.close()
conn.close()
print("\n✅  Migration terminée.")
