import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { startOfMonth, addMonths, subMonths } from 'date-fns';

interface AppState {
  // Selected month for dashboard views
  selectedMonth: Date;
  setSelectedMonth: (month: Date) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;

  // User's household
  householdId: string | null;
  setHouseholdId: (id: string | null) => void;

  // UI preferences
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // FAB visibility
  showFAB: boolean;
  setShowFAB: (show: boolean) => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Online status
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Month selection
      selectedMonth: startOfMonth(new Date()),
      setSelectedMonth: (month) =>
        set({ selectedMonth: startOfMonth(month) }),
      goToPreviousMonth: () =>
        set((state) => ({
          selectedMonth: subMonths(state.selectedMonth, 1),
        })),
      goToNextMonth: () =>
        set((state) => ({
          selectedMonth: addMonths(state.selectedMonth, 1),
        })),
      goToCurrentMonth: () =>
        set({ selectedMonth: startOfMonth(new Date()) }),

      // Household
      householdId: null,
      setHouseholdId: (id) => set({ householdId: id }),

      // UI
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // FAB
      showFAB: false,
      setShowFAB: (show) => set({ showFAB: show }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Online
      isOnline: true,
      setIsOnline: (online) => set({ isOnline: online }),
    }),
    {
      name: 'finansix-app-store',
      partialize: (state) => ({
        theme: state.theme,
        householdId: state.householdId,
        showFAB: state.showFAB,
      }),
    }
  )
);

// Selector hooks for common patterns
export const useSelectedMonth = () => useAppStore((state) => state.selectedMonth);
export const useHouseholdId = () => useAppStore((state) => state.householdId);
export const useTheme = () => useAppStore((state) => state.theme);
export const useIsOnline = () => useAppStore((state) => state.isOnline);
export const useShowFAB = () => useAppStore((state) => state.showFAB);
