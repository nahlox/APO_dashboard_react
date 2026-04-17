import { janData }  from './janvier'
import { febData }  from './fevrier'
import { marsData } from './mars'

// ─────────────────────────────────────────────────────────────────────────────
// MONTH REGISTRY — static months only (Jan/Fév/Mar)
// April onwards are loaded live from Supabase via useMoisDB.
//
// To add a new completed/archived month as a static file:
//   1. Create src/data/mai.js  (with _etl: { mois: 'mai', annee: 2026, ... })
//   2. Import it below
//   3. Append one entry to MONTH_DATA
// Sidebar nav, global panel charts/cards, section titles all auto-update.
// ─────────────────────────────────────────────────────────────────────────────
export const MONTH_DATA = [
  { key: 'jan', data: janData,  accent: 'var(--gold)',   rgba: 'rgba(242,140,40,'  },
  { key: 'feb', data: febData,  accent: 'var(--green)',  rgba: 'rgba(63,163,77,'   },
  { key: 'mar', data: marsData, accent: 'var(--accent)', rgba: 'rgba(107,201,122,' },
]
