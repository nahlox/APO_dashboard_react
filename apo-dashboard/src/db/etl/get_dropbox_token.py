"""
Génère un refresh_token Dropbox permanent (ne expire jamais).
À lancer UNE SEULE FOIS depuis le terminal.

Usage :
  python3 get_dropbox_token.py
"""

import dropbox
from dropbox import DropboxOAuth2FlowNoRedirect
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv(Path(__file__).parent / ".env")

APP_KEY    = os.environ.get("DROPBOX_APP_KEY", "")
APP_SECRET = os.environ.get("DROPBOX_APP_SECRET", "")

if not APP_KEY or not APP_SECRET:
    print("❌ Ajoute DROPBOX_APP_KEY et DROPBOX_APP_SECRET dans ton .env d'abord.")
    print("   Trouve-les sur : https://www.dropbox.com/developers/apps → ton app → Settings")
    exit(1)

auth_flow = DropboxOAuth2FlowNoRedirect(
    APP_KEY,
    APP_SECRET,
    token_access_type='offline',   # ← clé pour avoir un refresh_token permanent
)

authorize_url = auth_flow.start()
print()
print("=" * 60)
print("1. Ouvre ce lien dans ton navigateur :")
print(f"   {authorize_url}")
print()
print("2. Clique 'Autoriser'")
print("3. Copie le code affiché (exemple : oiABC123xyz)")
print("=" * 60)
print()

auth_code = input("Colle le code ici → ").strip()

try:
    oauth_result = auth_flow.finish(auth_code)
    refresh_token = oauth_result.refresh_token
    print()
    print("✅ Refresh token obtenu ! Ajoute-le dans ton .env :")
    print()
    print(f"DROPBOX_REFRESH_TOKEN={refresh_token}")
    print()
    print("Ce token ne expire JAMAIS. Conserve-le précieusement.")
except Exception as e:
    print(f"❌ Erreur : {e}")
