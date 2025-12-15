import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { api, type CompanyData } from '@/lib/api';

interface CompanyContextType {
  company: CompanyData | null;
  loading: boolean;
  refreshCompany: () => Promise<void>;
  applyColors: (primary?: string, secondary?: string, accent?: string) => void;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  loading: true,
  refreshCompany: async () => {},
  applyColors: () => {},
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  const applyColors = useCallback((primary?: string, secondary?: string, accent?: string) => {
    // Apply primary color
    if (primary) {
      const hsl = hexToHSL(primary);
      if (hsl) {
        const hslString = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
        document.documentElement.style.setProperty('--primary', hslString);
        document.documentElement.style.setProperty('--accent', hslString);
        document.documentElement.style.setProperty('--ring', hslString);
        document.documentElement.style.setProperty('--sidebar-primary', hslString);
        document.documentElement.style.setProperty('--sidebar-ring', hslString);
        
        // Calculate foreground color based on luminance
        const foregroundColor = hsl.l > 50 ? '0 0% 0%' : '0 0% 100%';
        document.documentElement.style.setProperty('--primary-foreground', foregroundColor);
        document.documentElement.style.setProperty('--accent-foreground', foregroundColor);
      }
    }
    
    // Apply secondary color
    if (secondary) {
      const hsl = hexToHSL(secondary);
      if (hsl) {
        document.documentElement.style.setProperty('--secondary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }
    
    // Apply accent/destructive color
    if (accent) {
      const hsl = hexToHSL(accent);
      if (hsl) {
        // Also update chart colors for consistency
        document.documentElement.style.setProperty('--chart-1', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }
  }, []);

  const refreshCompany = useCallback(async () => {
    try {
      const data = await api.getCompany();
      setCompany(data);
      
      // Apply colors if they exist
      if (data) {
        applyColors(data.primaryColor, data.secondaryColor, data.accentColor);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  }, [applyColors]);

  useEffect(() => {
    refreshCompany();
  }, [refreshCompany]);

  return (
    <CompanyContext.Provider value={{ company, loading, refreshCompany, applyColors }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}

// Helper function to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  if (!hex) return null;
  
  // Handle hex without # prefix
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  if (hex.length !== 6) return null;
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}
