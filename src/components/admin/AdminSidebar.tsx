import { 
  LayoutDashboard, 
  Package, 
  Cpu, 
  Building2, 
  Images, 
  Users, 
  Settings, 
  Mail, 
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';

type AdminTab = 'dashboard' | 'products' | 'hardware' | 'company' | 'carousels' | 'admins' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onNavigateExtract: () => void;
  onNavigateEmail: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'hardware', label: 'Hardware', icon: Cpu },
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'carousels', label: 'Banners', icon: Images },
  { id: 'admins', label: 'Administradores', icon: Users },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export function AdminSidebar({ 
  activeTab, 
  onTabChange, 
  onLogout, 
  onNavigateExtract, 
  onNavigateEmail,
  collapsed,
  onToggleCollapse
}: AdminSidebarProps) {
  const { company } = useCompany();

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {company?.logo ? (
            <img 
              src={company.logo} 
              alt={company.name || 'Logo'} 
              className={`object-contain transition-all ${collapsed ? 'h-8 w-8' : 'h-10'}`}
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: company?.primaryColor || '#E31C23' }}
            >
              <Building2 className="h-6 w-6 text-white" />
            </div>
          )}
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-foreground truncate">{company?.name || 'Painel Admin'}</p>
              <p className="text-xs text-muted-foreground">Painel de Controle</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}

        <div className="pt-4 mt-4 border-t border-border space-y-1">
          <button
            onClick={onNavigateExtract}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title={collapsed ? 'Importar em Massa' : undefined}
          >
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Importar em Massa</span>}
          </button>
          
          <button
            onClick={onNavigateEmail}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            title={collapsed ? 'Email Marketing' : undefined}
          >
            <Mail className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Email Marketing</span>}
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-destructive hover:bg-destructive/10 transition-all"
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
