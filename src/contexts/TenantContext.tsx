import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

// =====================================================
// TENANT CONTEXT - Multi-Tenant Management
// =====================================================
// Gerencia detecção de empresa, controle de planos e features

export interface Company {
  id: number;
  name: string;
  slug: string;
  custom_domain: string | null;
  logo: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  seller: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial' | 'expired';
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  license_key: string | null;
  license_activated_at: string | null;
  feature_monte_pc: boolean;
  feature_marketplace: boolean;
  feature_consignacao: boolean;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

interface TenantContextData {
  company: Company | null;
  loading: boolean;
  isMasterAdmin: boolean;
  hasFeature: (feature: string) => boolean;
  hasPlan: (minPlan: string) => boolean;
  refreshCompany: () => Promise<void>;
  applyTheme: () => void;
}

const TenantContext = createContext<TenantContextData>({
  company: null,
  loading: true,
  isMasterAdmin: false,
  hasFeature: () => false,
  hasPlan: () => false,
  refreshCompany: async () => {},
  applyTheme: () => {},
});

const API_BASE_URL = 'https://www.n8nbalao.com/api';

export function TenantProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);

  // Detectar empresa baseado no domínio/subdomínio
  const detectCompany = useCallback(async (): Promise<Company | null> => {
    try {
      // 1. Verificar se é master admin
      const masterAdminSession = sessionStorage.getItem('master_admin');
      if (masterAdminSession === 'true' && window.location.pathname.startsWith('/master-admin')) {
        setIsMasterAdmin(true);
        return null; // Master admin não precisa de company
      }

      // 2. Tentar detectar por domínio próprio
      const hostname = window.location.hostname;
      
      // 3. Tentar detectar por subdomínio
      const subdomain = hostname.split('.')[0];
      
      // 4. Fazer requisição à API para detectar empresa
      let url = `${API_BASE_URL}/tenant.php?`;
      
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('n8nbalao.com')) {
        // Domínio próprio
        url += `domain=${encodeURIComponent(hostname)}`;
      } else if (subdomain && subdomain !== 'www' && subdomain !== 'n8nbalao') {
        // Subdomínio
        url += `slug=${encodeURIComponent(subdomain)}`;
      } else {
        // Fallback: parâmetro de URL ou empresa padrão
        const params = new URLSearchParams(window.location.search);
        const companyParam = params.get('company');
        if (companyParam) {
          url += `slug=${encodeURIComponent(companyParam)}`;
        } else {
          // Empresa padrão (desenvolvimento)
          url += `id=1`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to detect company');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error detecting company:', error);
      return null;
    }
  }, []);

  // Aplicar tema da empresa
  const applyTheme = useCallback(() => {
    if (!company) return;

    const { primary_color, secondary_color, accent_color } = company;

    // Aplicar cor primária
    if (primary_color) {
      const hsl = hexToHSL(primary_color);
      if (hsl) {
        const hslString = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
        document.documentElement.style.setProperty('--primary', hslString);
        document.documentElement.style.setProperty('--accent', hslString);
        document.documentElement.style.setProperty('--ring', hslString);
        document.documentElement.style.setProperty('--sidebar-primary', hslString);
        document.documentElement.style.setProperty('--sidebar-ring', hslString);
        
        const foregroundColor = hsl.l > 50 ? '0 0% 0%' : '0 0% 100%';
        document.documentElement.style.setProperty('--primary-foreground', foregroundColor);
        document.documentElement.style.setProperty('--accent-foreground', foregroundColor);
      }
    }

    // Aplicar cor secundária
    if (secondary_color) {
      const hsl = hexToHSL(secondary_color);
      if (hsl) {
        document.documentElement.style.setProperty('--secondary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }

    // Aplicar cor de destaque
    if (accent_color) {
      const hsl = hexToHSL(accent_color);
      if (hsl) {
        document.documentElement.style.setProperty('--chart-1', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      }
    }

    // Aplicar logo no título da página
    if (company.name) {
      document.title = company.name;
    }

    // Aplicar favicon se houver logo
    if (company.logo) {
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = company.logo;
      }
    }
  }, [company]);

  // Verificar se tem uma feature específica
  const hasFeature = useCallback((feature: string): boolean => {
    if (!company) return false;

    switch (feature) {
      case 'monte_pc':
        return company.feature_monte_pc;
      
      case 'marketplace':
        return company.feature_marketplace;
      
      case 'consignacao':
        // Consignação requer marketplace ativo
        return company.feature_marketplace && company.feature_consignacao;
      
      case 'bulk_import':
        // Cadastramento em massa: Pro ou Enterprise
        return ['pro', 'enterprise'].includes(company.plan);
      
      case 'google_builder':
        // Criador de página: Apenas Enterprise
        return company.plan === 'enterprise';
      
      case 'n8n':
        // Integração n8n: Apenas Enterprise
        return company.plan === 'enterprise';
      
      default:
        return false;
    }
  }, [company]);

  // Verificar se tem um plano mínimo
  const hasPlan = useCallback((minPlan: string): boolean => {
    if (!company) return false;

    const planHierarchy: Record<string, number> = {
      basic: 1,
      pro: 2,
      enterprise: 3,
    };

    const currentLevel = planHierarchy[company.plan] || 0;
    const requiredLevel = planHierarchy[minPlan] || 0;

    return currentLevel >= requiredLevel;
  }, [company]);

  // Carregar empresa
  const refreshCompany = useCallback(async () => {
    setLoading(true);
    try {
      const detectedCompany = await detectCompany();
      setCompany(detectedCompany);
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  }, [detectCompany]);

  // Aplicar tema quando empresa mudar
  useEffect(() => {
    if (company) {
      applyTheme();
    }
  }, [company, applyTheme]);

  // Carregar empresa na inicialização
  useEffect(() => {
    refreshCompany();
  }, [refreshCompany]);

  return (
    <TenantContext.Provider
      value={{
        company,
        loading,
        isMasterAdmin,
        hasFeature,
        hasPlan,
        refreshCompany,
        applyTheme,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Helper: Converter hex para HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  if (!hex) return null;
  
  hex = hex.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  if (hex.length !== 6) return null;
  
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
