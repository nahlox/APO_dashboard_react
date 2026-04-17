import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // Navigation
  activeMonth: 'global',
  activeTab: {},

  // Données dynamiques depuis Supabase (alimenté par useMoisDB dans App.jsx)
  moisData: [],
  setMoisData: (moisData) => set({ moisData }),

  // UI
  sidebarCollapsed: false,
  sidebarOpen: false,
  theme: 'dark',
  currency: 'FCFA',
  USD_RATE: 563,

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
    currency: s.currency === 'FCFA' ? 'USD' : 'FCFA'
  })),
}))
