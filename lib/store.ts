import { create } from "zustand";

// Just keep an active module ID store for future use with chat history
interface ActiveModuleStore {
  activeModuleId: string | null;
  setActiveModuleId: (id: string | null) => void;
}

// Simple store for active module ID only - no persistence needed
export const useActiveModuleStore = create<ActiveModuleStore>((set) => ({
  activeModuleId: null,
  setActiveModuleId: (id) => set({ activeModuleId: id }),
}));
