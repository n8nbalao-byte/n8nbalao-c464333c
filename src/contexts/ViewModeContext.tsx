import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ViewMode = 'compact' | 'standard' | 'list';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('viewMode');
    return (saved as ViewMode) || 'standard';
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('viewMode', mode);
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
