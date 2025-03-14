import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Module {
  id: string;
  name: string;
  icon: string;
  lastStudied?: string | null;
}

interface ModuleStore {
  modules: Module[];
  loading: boolean;
  activeModuleId: string | null;
  setModules: (modules: Module[]) => void;
  setLoading: (loading: boolean) => void;
  setActiveModuleId: (id: string | null) => void;
  updateModuleLastStudied: (id: string) => void;
}

// Check if localStorage is available
const isClient = typeof window !== "undefined";

// Create store with simpler persistence to avoid hydration issues
export const useModuleStore = create<ModuleStore>()(
  persist(
    (set, get) => ({
      modules: [],
      loading: true,
      activeModuleId: null,
      setModules: (modules) => set({ modules }),
      setLoading: (loading) => set({ loading }),
      setActiveModuleId: (id) => set({ activeModuleId: id }),
      updateModuleLastStudied: (id) => {
        const modules = get().modules.map((module) => {
          if (module.id === id) {
            return {
              ...module,
              lastStudied: new Date().toISOString(),
            };
          }
          return module;
        });

        // Sort modules by lastStudied
        const sortedModules = [...modules].sort((a, b) => {
          if (!a.lastStudied) return 1;
          if (!b.lastStudied) return -1;
          return (
            new Date(b.lastStudied).getTime() -
            new Date(a.lastStudied).getTime()
          );
        });

        set({ modules: sortedModules });
      },
    }),
    {
      name: "module-storage",
      storage: isClient
        ? createJSONStorage(() => localStorage)
        : createJSONStorage(() => ({
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          })),
      skipHydration: true, // Skip hydration and load from scratch
    }
  )
);
