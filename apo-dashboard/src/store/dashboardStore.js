import { create } from 'zustand'

export const useDashboardStore = create((set) => ({
  // Navigation
  activeMonth: 'global',          // 'global' | 'jan' | 'feb'
  activeTab: {},                  // { jan: 'vue-ensemble', feb: 'vue-ensemble' }

  // UI
  sidebarCollapsed: false,
  theme: 'dark',                  // 'dark' | 'light'
  currency: 'FCFA',               // 'FCFA' | 'USD'
  USD_RATE: 563,                  // 1 USD = 563 FCFA

  // Actions
  setActiveMonth: (month) => set({ activeMonth: month }),
  setActiveTab: (month, tab) => set((s) => ({
    activeTab: { ...s.activeTab, [month]: tab }
  })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    document.body.classList.toggle('light', next === 'light')
    return { theme: next }
  }),
  toggleCurrency: () => set((s) => ({
    currency: s.currency === 'FCFA' ? 'USD' : 'FCFA'
  })),
}))
