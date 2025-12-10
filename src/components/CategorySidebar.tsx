import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getCategories, Category } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { Package, Cpu, Bot, Home, ChevronRight, ChevronDown, HardDrive, LucideIcon } from "lucide-react";
import { SidebarBanners } from "./SidebarBanners";

interface CategoryWithIcon extends Category {
  IconComponent: LucideIcon;
}

interface CategorySidebarProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
  selectedSubcategory?: string;
  onSubcategorySelect?: (subcategory: string | null) => void;
}

export function CategorySidebar({ 
  onCategorySelect, 
  selectedCategory,
  selectedSubcategory,
  onSubcategorySelect
}: CategorySidebarProps) {
  const [categories, setCategories] = useState<CategoryWithIcon[]>([]);
  const [hardwareSubcategories, setHardwareSubcategories] = useState<CategoryWithIcon[]>([]);
  const [isHardwareExpanded, setIsHardwareExpanded] = useState(false);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Determine active category from props or URL
  const activeCategory = selectedCategory || searchParams.get('category') || 'all';
  const activeSubcategory = selectedSubcategory || searchParams.get('subcategory') || null;
  
  // Expand hardware when it's selected
  useEffect(() => {
    if (activeCategory === 'hardware') {
      setIsHardwareExpanded(true);
    }
  }, [activeCategory]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const excludedCategories = ['games', 'console', 'controle', 'controles'];
        
        // Get all top-level categories
        const topLevelCats = await getCategories({ parent: null });
        
        // Add "Todos" at the beginning
        const allCategory: CategoryWithIcon = {
          key: 'all',
          label: 'Todos',
          icon: 'package',
          IconComponent: Package,
          isSystem: true
        };
        
        const mappedCategories: CategoryWithIcon[] = topLevelCats
          .filter(c => !excludedCategories.includes(c.key.toLowerCase()))
          .map(c => ({
            ...c,
            IconComponent: c.key === 'hardware' ? HardDrive : (getIconFromKey(c.icon) || Package)
          }));
        
        setCategories([allCategory, ...mappedCategories]);
        
        // Load hardware subcategories
        const hardwareSubs = await getCategories({ parent: 'hardware' });
        setHardwareSubcategories(hardwareSubs.map(c => ({
          ...c,
          IconComponent: getIconFromKey(c.icon) || Cpu
        })));
        
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    }
    loadCategories();
  }, []);

  const handleClick = (categoryKey: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryKey);
    }
    if (categoryKey === 'hardware') {
      setIsHardwareExpanded(!isHardwareExpanded);
    }
    // Reset subcategory when changing categories
    if (categoryKey !== 'hardware' && onSubcategorySelect) {
      onSubcategorySelect(null);
    }
  };

  const handleSubcategoryClick = (subcategoryKey: string) => {
    if (onSubcategorySelect) {
      onSubcategorySelect(subcategoryKey);
    }
    if (onCategorySelect) {
      onCategorySelect('hardware');
    }
  };

  const isOnLoja = location.pathname === '/loja';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen shrink-0">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Navegação
        </h2>
        
        {/* Fixed Navigation Links */}
        <div className="space-y-1 mb-6">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">Início</span>
          </Link>
          <Link
            to="/monte-voce-mesmo"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Cpu className="h-5 w-5" />
            <span className="font-medium">Monte seu PC</span>
          </Link>
          <Link
            to="/automacao"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Bot className="h-5 w-5 animate-vibrate" />
            <span className="font-medium">Fluxos n8n</span>
          </Link>
        </div>
        
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Categorias
        </h2>
        
        {/* Category Links */}
        <nav className="space-y-1">
          {categories.map((cat) => {
            const Icon = cat.IconComponent;
            const isActive = activeCategory === cat.key;
            const isHardware = cat.key === 'hardware';
            
            const buttonContent = (
              <>
                <Icon className="h-5 w-5" />
                <span className="flex-1">{cat.label}</span>
                {isHardware && hardwareSubcategories.length > 0 ? (
                  isHardwareExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                ) : isActive ? (
                  <ChevronRight className="h-4 w-4" />
                ) : null}
              </>
            );
            
            // If we have an onCategorySelect handler, use button, otherwise use Link
            if (onCategorySelect && isOnLoja) {
              return (
                <div key={cat.key}>
                  <button
                    onClick={() => handleClick(cat.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                      isActive 
                        ? 'bg-red-50 text-red-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {buttonContent}
                  </button>
                  
                  {/* Hardware Subcategories */}
                  {isHardware && isHardwareExpanded && hardwareSubcategories.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {/* "Todos" option for hardware */}
                      <button
                        onClick={() => {
                          if (onSubcategorySelect) onSubcategorySelect(null);
                          if (onCategorySelect) onCategorySelect('hardware');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm text-left ${
                          isActive && !activeSubcategory 
                            ? 'bg-red-50 text-red-600 font-medium' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Package className="h-4 w-4" />
                        <span>Todos</span>
                      </button>
                      
                      {hardwareSubcategories.map(sub => {
                        const SubIcon = sub.IconComponent;
                        const isSubActive = activeSubcategory === sub.key;
                        
                        return (
                          <button
                            key={sub.key}
                            onClick={() => handleSubcategoryClick(sub.key)}
                            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm text-left ${
                              isSubActive 
                                ? 'bg-red-50 text-red-600 font-medium' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <SubIcon className="h-4 w-4" />
                            <span>{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <div key={cat.key}>
                <Link
                  to={cat.key === 'all' ? '/loja' : `/loja?category=${cat.key}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-red-50 text-red-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {buttonContent}
                </Link>
                
                {/* Hardware Subcategories for Link mode */}
                {isHardware && isActive && hardwareSubcategories.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    <Link
                      to="/loja?category=hardware"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                        !activeSubcategory 
                          ? 'bg-red-50 text-red-600 font-medium' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Package className="h-4 w-4" />
                      <span>Todos</span>
                    </Link>
                    
                    {hardwareSubcategories.map(sub => {
                      const SubIcon = sub.IconComponent;
                      const isSubActive = activeSubcategory === sub.key;
                      
                      return (
                        <Link
                          key={sub.key}
                          to={`/loja?category=hardware&subcategory=${sub.key}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                            isSubActive 
                              ? 'bg-red-50 text-red-600 font-medium' 
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <SubIcon className="h-4 w-4" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        
        {/* Sidebar Promotional Banners */}
        <SidebarBanners />
      </div>
    </aside>
  );
}
