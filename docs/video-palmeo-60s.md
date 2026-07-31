# Palmeo — Vidéo site web · 60 secondes

Brief complet, prêt à transmettre à Claude Design.
Tout est calé sur l'app réelle (`apo-dashboard`) — aucune donnée APO, aucun nom réel.

---

## 0. Client démo (à utiliser partout)

| Champ | Valeur |
|---|---|
| Nom affiché | `Huilerie Sédia — Agro Industries` |
| Slug / tenant_id | `sedia` (affiché `SEDIA` dans l'en-tête du chat) |
| Période à l'écran | Janvier → Juin 2026 |
| Couleurs | palette Palmeo existante (gold `#F28C28` · green `#3FA34D` · red `#E05C5C`) |

> ⚠️ Vérifier avant publication qu'aucune huilerie réelle ne porte ce nom. Sinon : `Huilerie Doriva`, `Palmex Industries`.

---

## 1. Le script — 60 s, 8 scènes

**137 mots de voix off** (≈ 2,3 mots/s en français, rythme confortable).
La vidéo doit **fonctionner sans le son** : le texte à l'écran porte le message, la VO est une couche en plus.

---

### 0:00 → 0:05 · Le problème

> **VO** : « Votre huilerie tourne. Mais vos chiffres, eux, arrivent trois semaines plus tard. »

**Écran** : fondu rapide sur 3 plans (0,8 s chacun) — un classeur Excel surchargé, un cahier de production manuscrit, une photo WhatsApp de tableau de bord d'usine. Désaturé, légèrement flou.
**Texte** : `Vos données existent. Elles arrivent juste trop tard.`

---

### 0:05 → 0:12 · Les sources

> **VO** : « Palmeo se branche sur ce que vous avez déjà : Excel, Dropbox, Sage, votre ERP. Sans rien changer. »

**Écran** : les logos (Excel, Dropbox, Sage, Odoo, SAP, QuickBooks, Cegid, Google Sheets, « API maison ») convergent en flux animés vers le logo Palmeo au centre → transition vers le dashboard qui s'assemble.
**Texte** : `12 sources compatibles · zéro double saisie`

*Réutiliser le `LogoMarquee` de la landing (`palmeo-landing/src/App.jsx:89-102`) pour la cohérence graphique.*

---

### 0:12 → 0:22 · Le dashboard *(plan large, le cœur du produit)*

> **VO** : « Et chaque matin, tout est là. Production, taux d'extraction, marge à la tonne. En FCFA ou en euros, sur ordinateur comme sur téléphone. »

**Écran** : Vue d'Ensemble en plein écran. Les 6 cartes KPI s'incrémentent de 0 à leur valeur (0,6 s), puis les graphiques se dessinent l'un après l'autre. À 0:19, clic visible sur le toggle **FCFA → EUR** : tous les chiffres basculent d'un coup. À 0:21, split-screen desktop/mobile.
**Texte** : `Tout votre mois, en une vue`

**KPI à afficher (juin 2026)** :

| Carte | Valeur | Couleur |
|---|---|---|
| CA | `398 600 000 FCFA` | gold |
| Marge Brute | `39,1 %` | green |
| Résultat Net | `+ 53 800 000 FCFA` | green |
| Huile Produite | `497 T` | gold |
| Marge Nette | `13,5 %` | green |
| Revenu Net / Tonne | `108 250 FCFA` <br><small>FCFA/T · 497 T produites</small> | green |

En EUR : CA `607 660 €` · Résultat `+ 82 018 €` · Revenu net/T `165 €`.

**Évolution du CA (M FCFA)** — barres empilées Huile CPO / Noix Palmiste :

| | Jan | Fév | Mar | Avr | Mai | Juin |
|---|---|---|---|---|---|---|
| Huile CPO | 268,4 | 301,7 | 344,2 | 362,9 | 331,5 | 386,8 |
| Palmiste | 9,1 | 10,4 | 11,0 | 12,3 | 10,8 | 11,8 |
| **Total** | **277,5** | **312,1** | **355,2** | **375,2** | **342,3** | **398,6** |

**Résultat net (M FCFA)** : `31,2 · 38,6 · 47,1 · 52,4 · 34,9 · 53,8`
→ Le creux de **mai** est volontaire : c'est le sujet de la scène 5.

**Structure des dépenses (juin, hors matière première — total 84,2 M)** :
Salaires 37,1 % · Carburant & énergie 21,9 % · Transport 13,8 % · Maintenance 11,0 % · Consommables 6,1 % · Administratif 3,8 % · Frais bancaires 3,3 % · Divers 3,1 %

---

### 0:22 → 0:30 · Production & marché

> **VO** : « Votre rendement, jour par jour. Et pour la première fois, votre marge réelle face au cours mondial du CPO. »

**Écran** : jauge **Taux d'Extraction** qui monte à `21,5 %`, puis courbe TE journalier de juin, puis pan vers le graphe **Prix CPO — Marché International**.
**Texte** : `Votre rendement vs le marché mondial`

- Régimes reçus `2 480 T` · traités `2 310 T` · huile produite `497 T` · huile vendue `468 T`
- TE moyen `21,5 %` · `112 camions` · palmiste `62 T`
- TE journalier juin : `21,8 · 21,5 · 22,1 · 20,9 · 21,4 · 22,3 · 21,7 · 20,6 · 21,9 · 22,0 · 21,2 · 21,6 · 22,4 · 21,1 · 20,8 · 21,5 · 22,2 · 21,3 · 21,8 · 22,0 · 21,4 · 20,7 · 21,9 · 22,1 · 21,6 · 21,0 · 21,7 · 22,3 · 21,5 · 21,2`
- CPO international : `1 042 USD/t` · badge vert `+3,8 % vs mois préc.` · sous-titre `Source : FMI via FRED`

---

### 0:30 → 0:42 · Palmeo AI *(le moment fort — 12 s, le plus long)*

> **VO** : « Une question ? Palmeo AI interroge vos données en direct. "Pourquoi ma marge a baissé en mai ?" — la réponse en trois secondes, chiffrée, sourcée. »

**Écran** :
1. Le bouton flottant 🌴 pulse → le panneau de chat s'ouvre (en-tête `PALMAI · Assistant huilerie · SEDIA`)
2. L'écran d'accueil avec les puces de suggestion apparaît 1 s
3. La question se tape lettre par lettre dans le champ
4. Micro-animation « requête SQL en cours » (0,5 s — c'est vrai : l'IA écrit du SQL et l'exécute sur la base du client)
5. La réponse **streame** mot à mot, les chiffres en gras s'allument en gold

**Texte** : `Il ne devine pas. Il lit vos données.`

**Puces de suggestion (celles de l'app, `ChatBot.jsx:6-12`)** :
`Analyse la rentabilité du dernier mois` · `Quel est le taux d'extraction moyen ?` · `Pourquoi mon TE peut-il être bas ?`

**Échange à afficher — mot pour mot** :

> **Vous** — Pourquoi ma marge a baissé en mai ?
>
> **🌴 PALMAI**
> **Marge nette mai : 10,2 %** contre 14,0 % en avril.
>
> Trois causes, par ordre d'impact :
> · Taux d'extraction à **19,8 %** (vs 21,4 % en avril) — 4 jours d'arrêt du stérilisateur n°2
> · Prix moyen du régime à **111 F/kg**, +6 % vs avril
> · Charges carburant **+8,4 M FCFA** (groupe électrogène)
>
> À TE constant, mai aurait dégagé **48 M FCFA** au lieu de 34,9 M.

*(Chiffres cohérents avec le dashboard : 34,9 / 342,3 = 10,2 % · 52,4 / 375,2 = 14,0 %.)*

**Variante si besoin d'un 2ᵉ plan** — montre le rendu tableau du chat :
> **Vous** — Top 3 fournisseurs en juin ?
>
> | Fournisseur | Volume | Camions | Prix moyen |
> |---|---|---|---|
> | Trans-Kalé | 412 T | 19 | 106 F/kg |
> | Coop. Yélébo | 358 T | 16 | 104 F/kg |
> | GIE Manoro | 297 T | 14 | 107 F/kg |

---

### 0:42 → 0:50 · Le rapport quotidien

> **VO** : « Chaque matin à sept heures, un rapport part par email : synthèse rédigée par l'IA, alertes, chiffres de la veille. »

**Écran** : notification push qui glisse sur un écran de téléphone, puis l'email s'ouvre et défile doucement (en-tête vert → encadré synthèse IA → cartes KPI → graphe 7 jours → encadré d'alerte orange).
**Texte** : `7h00 · dans votre boîte mail, sans rien demander`

**Push** : `Huilerie Sédia — 18 juin · TE 21,6 %` / *TE stable, régimes reçus en baisse de 42 %.*

**Objet de l'email** : `Huilerie Sédia 18 juin · 22,4T huile · TE 21,6% · 1 alerte`

**Synthèse IA (encadré vert, bord gauche)** :
> Le taux d'extraction se maintient à 21,6 %, confirmant la stabilité du procédé sur la semaine. En revanche, les réceptions de régimes chutent de 42 % sur la journée : à surveiller de près, le stock tampon ne couvre la cadence actuelle que deux jours.

**Cartes KPI de l'email** :

| | Valeur | vs veille |
|---|---|---|
| Huile produite | 22,4 T | ▼ 7 % |
| Taux extraction | 21,6 % | ▼ 1 % |
| Régimes reçus | 54,8 T | ▼ 42 % |
| Régimes traités | 103,7 T | ▲ 3 % |
| Revenus | 17 M FCFA | ▼ 8 % |
| Charges | 4 M FCFA | ▲ 5 % |

**Graphe 7 jours (T d'huile)** : `21,3 · 23,8 · 22,6 · 24,9 · 23,1 · 24,0 · 22,4`
**Encadré alerte** : `📉 Régimes reçus en baisse de 42 % vs veille`
**Bouton** : `Ouvrir le tableau de bord →`

---

### 0:50 → 0:56 · Le compte de résultat

> **VO** : « Et en fin de mois, votre compte de résultat OHADA, généré tout seul. »

**Écran** : la page P&L se compose ligne par ligne, badge `DOCUMENT OFFICIEL`, puis clic sur **Télécharger PDF** → le PDF apparaît.
**Texte** : `Compte de résultat OHADA · automatique`

**P&L Juin 2026 — Huilerie Sédia** *(497 T d'huile produites)* :

| Ligne | Total FCFA | Par tonne |
|---|---|---|
| Ventes Huile CPO | 386 800 000 | 778 270 |
| Ventes Noix Palmiste | 11 800 000 | 23 742 |
| **Total Produits** | **398 600 000** | **802 012** |
| Coût Matière Première | – 242 600 000 | 488 129 |
| Charges d'Exploitation | – 84 200 000 | 169 416 |
| Amortissements | – 18 000 000 | 36 217 |
| **Total Charges** | **– 344 800 000** | **693 762** |
| **RÉSULTAT NET** | **+ 53 800 000** | **108 250** |

Bandeau de résumé : marge nette `13,5 %`.

---

### 0:56 → 1:00 · Signature

> **VO** : « Palmeo. Pilotez votre huilerie en temps réel. »

**Écran** : fond noir profond, logo Palmeo, orbe verte animée en arrière-plan (comme la landing).
**Texte** : `palmeo.co` · bouton `Démo gratuite`

---

## 2. Ce qu'il faut retirer avant de filmer

L'app affiche encore « APO » et « SARCI » en dur à ces endroits — à neutraliser sur la build de démo :

| Fichier | Ligne | Ce qui s'affiche | Remplacer par |
|---|---|---|---|
| `apo-dashboard/src/components/sections/Production.jsx` | 243 | `TE APO` | `Taux d'extraction` |
| `apo-dashboard/src/components/sections/Revenus.jsx` | 38 | `BLANC — chèque SARCI` | `Circuit BLANC` |
| `apo-dashboard/src/components/sections/Revenus.jsx` | 55, 137 | `Tonnes livrées (APO)` | `Tonnes livrées` |
| `apo-dashboard/src/hooks/useMoisDB.js` | 485, 583 | `BLANC — chèque SARCI` | `Circuit BLANC` |
| `apo-dashboard/src/components/layout/Sidebar.jsx` | 76, 78 | fallback `APO` / `Agro Palm Oil` | vient de `branding` si le tenant démo est configuré ✅ |
| `apo-dashboard/src/components/SplashScreen.jsx` | 8, 10 | idem | idem ✅ |
| `apo-dashboard/src/pages/PnLView.jsx` | 16 | fallback `APO Agro Palm Oil` | idem ✅ |
| `apo-dashboard/src/lib/generatePnlPdf.js` | 70 | défaut `APO — Agro Palm Oil` | idem ✅ |
| `apo-dashboard/src/assets/logo_apo.png` | — | logo APO | logo démo neutre |
| `palmeo-landing/src/App.jsx` | 191, 257, 601 | `APO Huilerie`, `APO — 18 juin` | `Huilerie Sédia` |

Les lignes ✅ se règlent toutes seules si le tenant `sedia` existe avec le bon `nom_affichage` — les 4 premières sont en dur et doivent être modifiées dans le code.

---

## 3. Comment produire la vidéo

**Recommandé — capture réelle + montage** : créer le tenant `sedia` via la console admin, injecter le jeu de données ci-dessus, enregistrer l'app en 1920×1080 à 60 fps. Claude Design ajoute ensuite les transitions, la typographie animée et l'habillage. C'est ce qui rend le mieux : le prospect voit le vrai produit, pas une maquette.

**Alternative — recréation animée** : Claude Design reconstruit les écrans en HTML/CSS animé à partir des chiffres ci-dessus. Contrôle total du timing, aucun risque de fuite de données, mais légèrement moins crédible.

**Détails qui comptent** :
- Format **16:9** pour la page d'accueil + une découpe **9:16** pour LinkedIn/WhatsApp
- Autoplay **muet** en boucle sur le site → le texte à l'écran doit tout raconter seul
- Musique : nappe instrumentale discrète, montée légère à 0:30 (l'arrivée de l'IA), coupure nette à 0:56
- Curseur visible sur les 3 interactions clés : toggle FCFA/EUR, ouverture du chat, bouton Télécharger PDF

---

## 4. Voix off

**Claude ne génère pas d'audio** — ni Claude Design, ni aucun autre agent Claude. Il produit le script, les visuels et le code, pas de piste sonore.

Trois options, par ordre de recommandation :

1. **Pas de voix off.** La plupart des vidéos SaaS en page d'accueil tournent en autoplay muet. Typographie animée + musique = plus propre, plus rapide, rien à re-produire quand le script évolue. Le script ci-dessus est déjà écrit pour ça.
2. **ElevenLabs** — les meilleures voix françaises du marché, quelques secondes de génération. Le texte VO est prêt à coller tel quel. Prendre une voix masculine posée, débit lent, et laisser respirer la pause avant « Palmeo. » à 0:56.
3. **Votre propre voix.** Sur un site B2B où le fondateur vend en direct, une VO humaine avec un accent réel inspire plus confiance qu'une voix de synthèse. Un micro correct suffit.

---

## 5. Un point à trancher

L'app affiche **`PALMAI`** dans l'en-tête du chat (`ChatBot.jsx:294`), pas « Palmeo AI ». Deux noms différents pour la même chose, c'est une friction inutile sur une page de vente. Soit renommer dans l'app, soit garder `PALMAI` dans la vidéo — mais choisir.
