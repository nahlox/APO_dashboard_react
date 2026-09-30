import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // Navigation
  activeMonth: 'global',
  activeTab: {},

  // Document P&L actuellement consulté (null = vue normale, sinon clé de mois)
  activePnlMonth: null,
  setActivePnlMonth: (key) => set({ activePnlMonth: key }),
  closePnlView:     ()    => set({ activePnlMonth: null }),

  // Panneau admin (création de nouveaux tenants) — réservé aux super-admins
  showAdmin: false,
  setShowAdmin: (v) => set({ showAdmin: v }),

  // Période filtrée : année + plage de mois (null = pas de filtre)
  monthRange: { year: null, from: null, to: null },
  setMonthRange: (from, to) => set((s) => ({ monthRange: { ...s.monthRange, from, to } })),
  // Changer d'année repart sur tous les mois disponibles de cette année
  setYear:       (year)     => set({ monthRange: { year, from: null, to: null } }),
  resetMonthRange:           () => set({ monthRange: { year: null, from: null, to: null } }),

  // Données dynamiques depuis Supabase (alimenté par useMoisDB dans App.jsx)
  moisData: [],
  setMoisData: (moisData) => set({ moisData }),

  // UI
  sidebarCollapsed: false,
  sidebarOpen: false,
  theme: 'light',  // 'light' | 'dark' | 'auto'
  currency: 'FCFA',
  eurRate: 655.957,        // taux live XOF→EUR (mis à jour au démarrage)
  eurRateDate: null,       // date du taux (ex: "2026-05-07")

  // Actions
  setActiveMonth: (month) => set({ activeMonth: month }),
  setActiveTab: (month, tab) => set((s) => ({
    activeTab:      { ...s.activeTab, [month]: tab },
    activePnlMonth: null,   // sortir de la vue P&L quand on change de module
  })),
  toggleSidebar:    () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileMenu: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeMobileMenu:  () => set({ sidebarOpen: false }),
  setTheme: (t) => set({ theme: t }),
  toggleCurrency: () => set((s) => ({
    currency: s.currency === 'FCFA' ? 'EUR' : 'FCFA'
  })),
  setEurRate: (rate, date) => set({ eurRate: rate, eurRateDate: date }),
}))
