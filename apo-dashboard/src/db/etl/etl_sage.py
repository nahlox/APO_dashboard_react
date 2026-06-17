"""
ETL Sage → Supabase  (template multi-client)
=============================================
Ce fichier est un squelette à instancier pour chaque client utilisant Sage.
Chercher tous les blocs marqués  ═══ PLACEHOLDER CLIENT ═══  et les remplir.

Architecture :
  Sage 100 / Sage 1000 (SQL Server)  →  pyodbc  →  transform  →  Supabase

Prérequis côté client :
  - Accès SQL Server (IP, port, credentials, nom de la base Sage)
  - Driver ODBC : "ODBC Driver 17 for SQL Server" (Windows) ou msodbcsql (Linux)
  - Droits SQL Server : SELECT sur les tables F_ECRITUREC, F_DOCENTETE, F_DOCLIGNE,
                        F_COMPTEG, F_ARTICLE, F_STOCK (voir README Sage)

Usage :
  python etl_sage.py --tenant <id_tenant>
  python etl_sage.py --tenant <id_tenant> --mois 4
  python etl_sage.py --tenant <id_tenant> --dry

Prérequis (.env) :
  SUPABASE_URL          = https://xxxx.supabase.co
  SUPABASE_KEY          = eyJ...
  SAGE_SERVER           = 192.168.x.x\\SQLEXPRESS  (ou IP,port)
  SAGE_DATABASE         = NOM_BASE_SAGE             (ex: APO2026, COMPTA_CI)
  SAGE_USER             = sa
  SAGE_PASSWORD         = xxxxxx
"""

import os, argparse
from datetime import datetime
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# ── CONFIG ────────────────────────────────────────────────────
load_dotenv(Path(__file__).parent / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# Connexion SQL Server — variables d'env, jamais en dur dans le code
SAGE_SERVER   = os.environ.get("SAGE_SERVER",   "")   # ex: "192.168.1.10\\SQLEXPRESS"
SAGE_DATABASE = os.environ.get("SAGE_DATABASE", "")   # ex: "COMPTA_APO"
SAGE_USER     = os.environ.get("SAGE_USER",     "")
SAGE_PASSWORD = os.environ.get("SAGE_PASSWORD", "")

DRY_RUN   = False
TENANT_ID = None

ANNEE_COURANTE = datetime.now().year
MOIS_MAX       = datetime.now().month

LIBELLES_FR = {
    1: 'janvier', 2: 'février',  3: 'mars',     4: 'avril',
    5: 'mai',     6: 'juin',     7: 'juillet',   8: 'août',
    9: 'septembre', 10: 'octobre', 11: 'novembre', 12: 'décembre',
}

CHUNK_SIZE = 200


# ── CONNEXION SQL SERVER ──────────────────────────────────────

def get_sage_connection():
    """
    Ouvre une connexion pyodbc vers SQL Server / Sage.
    Installer : pip install pyodbc
    Driver Windows : "ODBC Driver 17 for SQL Server"
    Driver Linux   : msodbcsql17 (voir https://learn.microsoft.com/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server)
    """
    try:
        import pyodbc
    except ImportError:
        raise ImportError("Installer pyodbc : pip install pyodbc")

    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={SAGE_SERVER};"
        f"DATABASE={SAGE_DATABASE};"
        f"UID={SAGE_USER};"
        f"PWD={SAGE_PASSWORD};"
        "TrustServerCertificate=yes;"
        "timeout=30;"
    )
    return pyodbc.connect(conn_str)


def query_sage(sql: str, params=()) -> list[dict]:
    """Exécute une requête SELECT sur Sage et retourne une liste de dicts."""
    conn = get_sage_connection()
    cur  = conn.cursor()
    cur.execute(sql, params)
    cols = [col[0] for col in cur.description]
    rows = [dict(zip(cols, row)) for row in cur.fetchall()]
    conn.close()
    return rows


# ── UTILITAIRES (identiques à etl_cloud.py) ──────────────────

def log(msg: str):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)

def safe_float(val, default=0.0) -> float:
    try:   return float(val) if val is not None else default
    except (TypeError, ValueError): return default

def safe_int(val, default=0) -> int:
    try:   return int(val) if val is not None else default
    except (TypeError, ValueError): return default


def inserer(table: str, rows: list, periode_id: int | None = None, label: str = ""):
    if not rows:
        log(f"  ℹ️  {table} : aucune ligne à insérer {label}")
        return
    if TENANT_ID:
        for r in rows:
            r["tenant_id"] = TENANT_ID
    if DRY_RUN:
        log(f"  [DRY] {table} : {len(rows)} lignes (période {periode_id}) {label}")
        return
    if periode_id is not None:
        q = sb.table(table).delete().eq("periode_id", periode_id)
        if TENANT_ID:
            q = q.eq("tenant_id", TENANT_ID)
        q.execute()
    for i in range(0, len(rows), CHUNK_SIZE):
        sb.table(table).insert(rows[i:i + CHUNK_SIZE]).execute()
    log(f"  ✅ {table} : {len(rows)} lignes insérées {label}")


def get_periode_id(annee: int, mois: int) -> int | None:
    q = sb.table("periodes").select("id").eq("annee", annee).eq("mois", mois)
    if TENANT_ID:
        q = q.eq("tenant_id", TENANT_ID)
    r = q.execute()
    return r.data[0]["id"] if r.data else None


def assurer_periodes() -> dict:
    periodes = {}
    for mois in range(1, MOIS_MAX + 1):
        pid = get_periode_id(ANNEE_COURANTE, mois)
        if not pid:
            log(f"  📅 Création période {LIBELLES_FR[mois]} {ANNEE_COURANTE}...")
            if not DRY_RUN:
                row = {"annee": ANNEE_COURANTE, "mois": mois, "libelle": LIBELLES_FR[mois]}
                if TENANT_ID:
                    row["tenant_id"] = TENANT_ID
                sb.table("periodes").insert(row).execute()
                pid = get_periode_id(ANNEE_COURANTE, mois)
        periodes[mois] = pid
    return periodes


# ════════════════════════════════════════════════════════════════
# ═══ PARSEURS — À ADAPTER PAR CLIENT ════════════════════════════
#
#  Chaque fonction ci-dessous contient :
#    - La REQUÊTE SQL Sage à personnaliser (noms de tables/colonnes)
#    - Le MAPPING des colonnes Sage → colonnes Supabase
#    - Des commentaires indiquant ce qui change selon la version Sage
#
#  Tables Sage 100 courantes :
#    F_ECRITUREC   → écritures comptables (journal général)
#    F_DOCENTETE   → entêtes documents (factures, BL, commandes)
#    F_DOCLIGNE    → lignes de documents
#    F_COMPTEG     → plan comptable général
#    F_ARTICLE     → articles / produits
#    F_STOCK       → mouvements de stock
#    F_FAMILLE     → familles d'articles
#    F_COMPTET     → comptes tiers (fournisseurs, clients)
#
#  Comptes comptables clés (plan OHADA / Sage Afrique) :
#    7xxx → Produits / CA
#    6xxx → Charges
#    3xxx → Stocks
#    4xxx → Tiers (clients 4110-4119, fournisseurs 4010-4019)
# ════════════════════════════════════════════════════════════════


def parse_ventes_huile_sage(mois: int, periode_id: int):
    """
    Extrait les ventes d'huile depuis Sage.

    ═══ PLACEHOLDER CLIENT ═══
    Adapter :
      - Le numéro de compte (ici 701xxxxx = ventes huile CPO)
      - Les colonnes EA_Piece, EA_Date, EA_Montant... selon votre version Sage
      - Le journal de vente (EC_No = 'VTE' ou similaire)
    """
    # ─── REQUÊTE SAGE À PERSONNALISER ────────────────────────
    sql = """
        SELECT
            EC_Date      AS date_vente,
            EA_Libelle   AS libelle,
            EA_Quantite  AS poids_apo_kg,
            EA_PrixUnitaire AS prix_kg,
            EA_Montant   AS montant_fcfa
        FROM F_ECRITUREC ec
        JOIN F_ECRITUREA ea ON ec.EC_No = ea.EC_No
        WHERE
            ea.EA_Compte LIKE '701%'          -- ═══ PLACEHOLDER : compte ventes huile
            AND YEAR(EC_Date)  = ?
            AND MONTH(EC_Date) = ?
            AND EC_Sens = 1                    -- 1 = crédit = produit
        ORDER BY EC_Date
    """
    # ─────────────────────────────────────────────────────────

    rows_sage = query_sage(sql, (ANNEE_COURANTE, mois))
    rows = []
    for r in rows_sage:
        rows.append({
            "periode_id":     periode_id,
            "date_vente":     r["date_vente"].date().isoformat() if r["date_vente"] else None,
            "libelle":        str(r["libelle"] or ""),
            "poids_apo_kg":   safe_float(r["poids_apo_kg"]),
            "prix_kg":        safe_float(r["prix_kg"]),
            # poids_sarci_kg non dispo dans Sage → 0 (à confirmer poids SARCI ou non)
            "poids_sarci_kg": 0.0,
        })
    inserer("ventes_huile", rows, periode_id, f"(mois {mois})")


def parse_charges_sage(mois: int, periode_id: int):
    """
    Extrait les charges d'exploitation depuis Sage (comptes 6xxx).
    Alimente caisse_apo (on réutilise la table existante comme destination).

    ═══ PLACEHOLDER CLIENT ═══
    Adapter :
      - La plage de comptes (6000 à 6999 = toutes charges)
      - Le journal de charges (EC_Journal = 'ACH', 'OD', etc.)
      - La catégorie : soit via le sous-compte Sage, soit via categorize_libelle()
    """
    sql = """
        SELECT
            EC_Date       AS date_mouvement,
            EA_Libelle    AS libelle,
            EA_Montant    AS credit_fcfa,
            EA_Compte     AS compte_sage,
            EC_Piece      AS numero_piece
        FROM F_ECRITUREC ec
        JOIN F_ECRITUREA ea ON ec.EC_No = ea.EC_No
        WHERE
            ea.EA_Compte BETWEEN '600000' AND '699999'  -- ═══ PLACEHOLDER : plage charges
            AND YEAR(EC_Date)  = ?
            AND MONTH(EC_Date) = ?
            AND EC_Sens = 0                              -- 0 = débit = charge
        ORDER BY EC_Date
    """

    # ═══ PLACEHOLDER CLIENT : mapping compte Sage → catégorie APO ═══
    COMPTE_TO_CAT = {
        "601": "fournitures_usine",    # achats matières premières
        "602": "fournitures_usine",    # achats autres appros
        "611": "services_ext",         # sous-traitance générale
        "612": "services_ext",         # locations
        "616": "services_ext",         # primes assurances
        "621": "autres_services_ext",  # personnel extérieur
        "631": "taxes_fiscales",       # impôts taxes
        "641": "charges_personnel",    # rémunérations personnel
        "661": "frais_bancaires",      # charges intérêts
        "681": "amortissement",        # dotations amort.
    }

    rows_sage = query_sage(sql, (ANNEE_COURANTE, mois))
    rows = []
    for r in rows_sage:
        compte = str(r["compte_sage"] or "")
        cat    = next((v for k, v in COMPTE_TO_CAT.items() if compte.startswith(k)), "autres_charges")
        rows.append({
            "periode_id":     periode_id,
            "date_mouvement": r["date_mouvement"].date().isoformat() if r["date_mouvement"] else None,
            "libelle":        str(r["libelle"] or ""),
            "credit_fcfa":    safe_float(r["credit_fcfa"]),
            "debit_fcfa":     0.0,
            "solde_fcfa":     0.0,
            "categorie":      cat,
        })
    inserer("caisse_apo", rows, periode_id, f"[sage] (mois {mois})")


def parse_achats_regimes_sage(mois: int, periode_id: int):
    """
    Extrait les achats de régimes (matière première) depuis Sage.

    ═══ PLACEHOLDER CLIENT ═══
    Adapter :
      - Le compte d'achat MP (ici 601xxx = achats régimes)
      - La table fournisseurs Sage (F_COMPTET avec CT_Type=0)
      - Les colonnes de poids/quantité (EA_Quantite ou colonne analytique)
    """
    sql = """
        SELECT
            EC_Date          AS date_achat,
            ea.EA_Libelle    AS libelle,
            ct.CT_Intitule   AS nom_fournisseur,
            ct.CT_Num        AS ref_fournisseur,
            EA_Quantite      AS poids_kg,
            EA_PrixUnitaire  AS prix_kg,
            EA_Montant       AS montant_total
        FROM F_ECRITUREC ec
        JOIN F_ECRITUREA ea ON ec.EC_No = ea.EC_No
        JOIN F_COMPTET   ct ON ea.EA_CompteT = ct.CT_Num
        WHERE
            ea.EA_Compte LIKE '601%'         -- ═══ PLACEHOLDER : compte achats MP
            AND ct.CT_Type = 0               -- 0 = fournisseur
            AND YEAR(EC_Date)  = ?
            AND MONTH(EC_Date) = ?
        ORDER BY EC_Date
    """

    rows_sage = query_sage(sql, (ANNEE_COURANTE, mois))

    # Upsert fournisseurs
    refs_vus = {r["ref_fournisseur"] for r in rows_sage if r["ref_fournisseur"]}
    if not DRY_RUN:
        for ref in refs_vus:
            nom = next((r["nom_fournisseur"] for r in rows_sage if r["ref_fournisseur"] == ref), ref)
            row = {"reference": str(ref), "nom": str(nom or ref)}
            if TENANT_ID:
                row["tenant_id"] = TENANT_ID
            sb.table("fournisseurs").upsert(row, on_conflict="reference,tenant_id").execute()

    fournisseurs_map = {}
    for ref in refs_vus:
        q = sb.table("fournisseurs").select("id").eq("reference", str(ref))
        if TENANT_ID:
            q = q.eq("tenant_id", TENANT_ID)
        r = q.single().execute()
        if r.data:
            fournisseurs_map[str(ref)] = r.data["id"]

    rows = []
    for r in rows_sage:
        ref = str(r["ref_fournisseur"] or "INCONNU")
        rows.append({
            "periode_id":     periode_id,
            "fournisseur_id": fournisseurs_map.get(ref),
            "date_achat":     r["date_achat"].date().isoformat() if r["date_achat"] else None,
            "type_transport": "",      # ═══ PLACEHOLDER : non dispo dans Sage standard
            "numero_camion":  "",      # ═══ PLACEHOLDER : à récupérer depuis champ libre
            "poids_kg":       safe_float(r["poids_kg"]),
            "prix_kg":        safe_float(r["prix_kg"]),
            "prix_transport": 0.0,     # ═══ PLACEHOLDER : si facturé séparément
            "appro_caisse":   0.0,
        })
    inserer("achats_regimes", rows, periode_id, f"[sage] (mois {mois})")


def parse_production_sage(mois: int, periode_id: int):
    """
    Production journalière depuis Sage (si module Fabrication/Production).

    ═══ PLACEHOLDER CLIENT ═══
    Sage 100 Fabrication utilise F_ORDREFA (ordres de fabrication) et
    F_MOUVSTOCK pour les entrées/sorties de stock.
    Si le client n'a pas le module Fab, cette section reste vide et les
    données de production devront venir d'un autre fichier (Excel, CSV).

    Alternative commune : export CSV quotidien depuis l'application de pesée
    (balance/pont-bascule) → à adapter selon l'équipement du client.
    """

    # ═══ PLACEHOLDER CLIENT : décommenter et adapter selon module Sage ═══
    #
    # sql = """
    #     SELECT
    #         MS_Date           AS date_production,
    #         SUM(MS_Quantite)  AS regime_recu_kg,     -- entrées régimes
    #         0                 AS huile_produite_kg   -- ═══ PLACEHOLDER
    #     FROM F_MOUVSTOCK
    #     WHERE
    #         AR_Ref = 'REGIME'                        -- ═══ PLACEHOLDER : code article régimes
    #         AND YEAR(MS_Date) = ?
    #         AND MONTH(MS_Date) = ?
    #         AND MS_Sens = 0                          -- 0 = entrée
    #     GROUP BY MS_Date
    #     ORDER BY MS_Date
    # """
    # rows_sage = query_sage(sql, (ANNEE_COURANTE, mois))
    # rows = [{ "periode_id": periode_id, "date_production": r["date_production"].isoformat(), ... }]
    # inserer("production_journaliere", rows, periode_id, f"[sage] (mois {mois})")

    log(f"  ⚠️  parse_production_sage : PLACEHOLDER non implémenté (mois {mois})")


def recalculer_kpis_sage(mois: int, periode_id: int):
    """
    Recalcule kpis_mensuels depuis les tables Supabase (identique à etl_cloud.py).
    Aucune requête Sage supplémentaire ici — on lit ce qu'on vient d'insérer.
    """
    vh  = sb.table("ventes_huile").select("montant_fcfa").eq("periode_id", periode_id).execute()
    ca1 = sb.table("caisse_apo").select("credit_fcfa,libelle,categorie").eq("periode_id", periode_id).execute()
    ar  = sb.table("achats_regimes").select("poids_kg,montant_total").eq("periode_id", periode_id).execute()

    CATS_FIN = {"amortissement", "frais_bancaires"}

    ca_huile     = sum(safe_float(r.get("montant_fcfa")) for r in (vh.data or []))
    charges_op   = sum(safe_float(r["credit_fcfa"]) for r in (ca1.data or []) if r.get("categorie") not in CATS_FIN)
    amort        = sum(safe_float(r["credit_fcfa"]) for r in (ca1.data or []) if r.get("categorie") == "amortissement")

    total_poids  = sum(safe_float(r.get("poids_kg"))     for r in (ar.data or []))
    total_mont   = sum(safe_float(r.get("montant_total")) for r in (ar.data or []))
    prix_moy     = total_mont / total_poids if total_poids else 0

    ca_total = ca_huile   # ═══ PLACEHOLDER : ajouter palmiste, florentin si applicable
    cout_mp  = total_mont
    resultat = ca_total - cout_mp - charges_op - amort
    marge    = round(resultat / ca_total * 100, 2) if ca_total else 0

    payload = {
        "periode_id":           periode_id,
        **({"tenant_id": TENANT_ID} if TENANT_ID else {}),
        "ca_huile_fcfa":        ca_huile,
        "ca_palmiste_fcfa":     0,  # ═══ PLACEHOLDER
        "ca_florentin_fcfa":    0,  # ═══ PLACEHOLDER
        "ca_bassin_fcfa":       0,  # ═══ PLACEHOLDER
        "cout_mp_fcfa":         cout_mp,
        "charges_exploitation": charges_op,
        "amortissement_fcfa":   amort,
        "marge_nette_pct":      marge,
        "regimes_recus_kg":     total_poids,
        "regimes_traites_kg":   0,  # ═══ PLACEHOLDER
        "huile_produite_kg":    0,  # ═══ PLACEHOLDER
        "huile_vendue_kg":      0,  # ═══ PLACEHOLDER
        "taux_extraction":      0,  # ═══ PLACEHOLDER
        "nb_camions":           len(ar.data or []),
        "prix_moyen_regime_kg": round(prix_moy, 2),
        "mis_a_jour_le":        datetime.now().isoformat(),
    }

    if not DRY_RUN:
        sb.table("kpis_mensuels").upsert(payload, on_conflict="periode_id").execute()
    log(f"  ✅ KPIs [sage] mois {mois} — CA : {ca_total:,.0f} | Charges : {charges_op:,.0f} | Résultat : {resultat:,.0f} FCFA")


# ── ORCHESTRATEUR ─────────────────────────────────────────────

def run(mois_cible: int | None = None):
    log("=" * 60)
    log(f"ETL Sage → Supabase — tenant: {TENANT_ID} — {ANNEE_COURANTE}")
    if DRY_RUN:
        log("⚠️  MODE DRY-RUN — aucune écriture Supabase")
    log("=" * 60)

    # Vérification connexion Sage
    try:
        query_sage("SELECT 1 AS ping")
        log("✅ Connexion SQL Server / Sage OK")
    except Exception as e:
        log(f"❌ Impossible de se connecter à Sage SQL Server : {e}")
        log("   Vérifier SAGE_SERVER, SAGE_DATABASE, SAGE_USER, SAGE_PASSWORD dans .env")
        return

    periodes = assurer_periodes()
    if mois_cible:
        periodes = {mois_cible: periodes[mois_cible]}
    log(f"  Mois traités : {list(periodes.keys())}")

    for mois, periode_id in periodes.items():
        log(f"─── Mois {mois} ({LIBELLES_FR[mois]}) ───")
        try:
            parse_ventes_huile_sage(mois, periode_id)
        except Exception as e:
            log(f"  ❌ ventes_huile : {e}")

        try:
            parse_charges_sage(mois, periode_id)
        except Exception as e:
            log(f"  ❌ charges : {e}")

        try:
            parse_achats_regimes_sage(mois, periode_id)
        except Exception as e:
            log(f"  ❌ achats_regimes : {e}")

        try:
            parse_production_sage(mois, periode_id)
        except Exception as e:
            log(f"  ❌ production : {e}")

        try:
            recalculer_kpis_sage(mois, periode_id)
        except Exception as e:
            log(f"  ❌ kpis : {e}")

    log("=" * 60)
    log("ETL Sage terminé ✅")
    log("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ETL Sage SQL Server → Supabase")
    parser.add_argument("--tenant", required=True, help="ID tenant (ex: huilerie_xyz)")
    parser.add_argument("--mois",   type=int,      help="Mois à importer (1-12)")
    parser.add_argument("--dry",    action="store_true", help="Simulation sans écriture")
    args = parser.parse_args()

    DRY_RUN   = args.dry
    TENANT_ID = args.tenant
    run(mois_cible=args.mois)
