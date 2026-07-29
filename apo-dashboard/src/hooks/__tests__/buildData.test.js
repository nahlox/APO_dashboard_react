/**
 * Test de non-régression des KPIs — mars 2026 (données réelles APO).
 *
 * La fixture a été capturée depuis la base de PRODUCTION *avant* la migration
 * vers la table canonique `transactions` (29 juillet 2026). Les valeurs
 * attendues ci-dessous sont donc celles qu'affichait le dashboard avant
 * refonte : si un changement de code ou de schéma déplace un chiffre du
 * compte de résultat, ce test échoue.
 *
 * Règles de calcul officielles : voir src/lib/kpiEngine.js
 */
import { describe, it, expect } from 'vitest'
import { buildData } from '../useMoisDB'
import fixture from './fixtures/mars2026.json'

const {
  kpis, periode, prod, ventes, caisse, banque, amort, achats, topf,
} = fixture

function build() {
  return buildData(kpis, periode, prod, ventes, caisse, topf, amort, banque, 1_300_000, achats, {})
}

describe('buildData — mars 2026 (golden)', () => {
  it("reproduit le compte de résultat à l'identique", () => {
    const { kpis: k, pnl } = build()

    // ── Chiffre d'affaires ────────────────────────────────────────────
    expect(k.caTotalFCFA).toBe(1_584_923_152)
    expect(k.caHuileFCFA).toBe(1_509_869_152)
    expect(k.caNoisFCFA).toBe(68_214_000)
    expect(k.caBassinFCFA).toBe(6_840_000)

    // Le CA total est bien la somme des composantes
    expect(k.caHuileFCFA + k.caNoisFCFA + k.caHuileFlorentinFCFA + k.caBassinFCFA)
      .toBe(k.caTotalFCFA)

    // BLANC + NOIR = CA huile (± arrondis de prix)
    expect(k.caHuileBlancFCFA + k.caHuileNoirFCFA).toBeGreaterThan(0)

    // ── Coûts et résultats ────────────────────────────────────────────
    expect(k.coutMPFCFA).toBeCloseTo(1_135_017_921.82, 2)
    expect(k.chargesExplFCFA).toBeGreaterThan(0)
    expect(k.amortissementFCFA).toBeGreaterThan(0)

    // Chaîne du compte de résultat : CA − MP = marge brute
    expect(pnl.margeBruteTotal).toBe(k.caTotalFCFA - k.coutMPFCFA)
    // EBITDA = marge brute − charges d'exploitation
    expect(pnl.ebitdaTotal).toBe(pnl.margeBruteTotal - k.chargesExplFCFA)
    // Résultat net = résultat d'exploitation − amortissements/frais fin. − BIC
    expect(pnl.resultatTotal).toBe(k.resultatNetFCFA)
    expect(k.resultatNetFCFA).toBeCloseTo(
      k.resultatExplFCFA - k.amortissementFCFA + pnl.totalBICTotal, 2
    )
    // Valeur de référence figée (identique au recalcul ETL de mars 2026)
    expect(Math.round(k.resultatNetFCFA)).toBe(285_913_836)

    // ── Production ────────────────────────────────────────────────────
    expect(k.regimesRecusT).toBe(13_148)
    expect(k.regimesTraitesT).toBe(13_204)
    expect(k.huileProduiteT).toBe(2_538)
    expect(k.tauxExtraction).toBeCloseTo(19.22, 2)

    // ── Cohérence par tonne ───────────────────────────────────────────
    expect(pnl.totalProduitsTonne).toBe(Math.round(k.caTotalFCFA / k.huileProduiteT))
    expect(k.revenuNetParTonne).toBe(Math.round(k.resultatNetFCFA / k.huileProduiteT))
    expect(k.margeNette).toBeCloseTo(+((k.resultatNetFCFA / k.caTotalFCFA) * 100).toFixed(1), 1)
  })

  it('agrège les charges par catégorie sans perte de montant', () => {
    const { charges, kpis: k } = build()
    const somme = charges.topDepenses.reduce((s, d) => s + d.mt, 0)
    expect(somme).toBe(k.chargesExplFCFA)
    expect(charges.topDepenses.every(d => d.mt >= 0)).toBe(true)
  })

  it('sépare les charges financières (section IV) des charges opérationnelles', () => {
    const { pnl } = build()
    // Amortissement + agios ne doivent jamais apparaître dans les charges d'exploitation
    const labelsExpl = pnl.chargesExploitation.map(c => c.label.toLowerCase())
    expect(labelsExpl.some(l => l.includes('amortissement'))).toBe(false)
    expect(labelsExpl.some(l => l.includes('agios'))).toBe(false)
    expect(pnl.amortissements.length).toBeGreaterThan(0)
  })

  it('utilise le fallback production par tenant (jamais un autre tenant)', () => {
    // prodJour vide + fallback fourni → les graphiques viennent du fallback du tenant
    const withFallback = buildData(
      kpis, periode, [], ventes, caisse, topf, amort, banque, 1_300_000, achats,
      { '2026-3': { grainesDailyLabels: ['01'], grainesDailyKg: [123], teDailyLabels: ['01'], teDailyVals: [19], stockHuileKg: 456 } }
    )
    expect(withFallback.production.grainesDailyKg).toEqual([123])
    expect(withFallback.production.stockHuileKg).toBe(456)

    // Sans fallback (nouveau tenant) → pas de données empruntées, graphiques vides
    const noFallback = buildData(kpis, periode, [], ventes, caisse, topf, amort, banque, 1_300_000, achats, {})
    expect(noFallback.production.grainesDailyKg).toEqual([])
    expect(noFallback.production.stockHuileKg).toBe(0)
  })
})
