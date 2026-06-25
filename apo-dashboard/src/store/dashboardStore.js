import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // Navigation
  activeMonth: 'global',
  activeTab: {},

  // Document P&L actuellement consulté (null = vue normale, sinon clé de mois)
  activePnlMonth: null,
  setActivePnlMonth: (key) => set({ activePnlMonth: key }),
  closePnlView:     ()    => set({ activePnlMonth: null }),

  // Plage de mois filtrée (null = tous les mois disponibles)
  monthRange: { from: null, to: null },
  setMonthRange: (from, to) => set({ monthRange: { from, to } }),
  resetMonthRange:           () => set({ monthRange: { from: null, to: null } }),

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
