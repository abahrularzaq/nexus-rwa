import { create } from 'zustand';

interface UiStore {
  sidebarOpen: boolean;
  activePage: string;
  setSidebarOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  activePage: 'overview',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActivePage: (page) => set({ activePage: page }),
}));