import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // Navigation
  activeMonth: 'global',
  activeTab: {},

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
  theme: 'light',
  currency: 'FCFA',
  eurRate: 655.957,        // taux live XOF→EUR (mis à jour au démarrage)
  eurRateDate: null,       // date du taux (ex: "2026-05-07")

  // Actions
  setActiveMonth: (month) => set({ activeMonth: month }),
  setActiveTab: (month, tab) => set((s) => ({
    activeTab: { ...s.activeTab, [month]: tab }
  })),
  toggleSidebar:    () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileMenu: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeMobileMenu:  () => set({ sidebarOpen: false }),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    document.body.classList.toggle('light', next === 'light')
    return { theme: next }
  }),
  toggleCurrency: () => set((s) => ({
    currency: s.currency === 'FCFA' ? 'EUR' : 'FCFA'
  })),
  setEurRate: (rate, date) => set({ eurRate: rate, eurRateDate: date }),
}))
