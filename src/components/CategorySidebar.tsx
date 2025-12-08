import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getCustomCategories } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { Package, Cpu, Bot, Home, ChevronRight, HardDrive } from "lucide-react";

// Only system categories (not deletable by user)
const systemCategories = [
  { key: 'all', label: 'Todos', icon: Package },
  { key: 'hardware', label: 'Hardware', icon: HardDrive },
];

interface CategorySidebarProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
}

export function CategorySidebar({ onCategorySelect, selectedCategory }: CategorySidebarProps) {
  const [categories, setCategories] = useState(systemCategories);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Determine active category from props or URL
  const activeCategory = selectedCategory || searchParams.get('category') || 'all';

  useEffect(() => {
    async function loadCategories() {
      try {
        const customCats = await getCustomCategories();
        const excludedCategories = ['games', 'console', 'controle', 'controles'];
        
        // Get all categories from database, excluding system ones and excluded ones
        const systemKeys = systemCategories.map(c => c.key);
        const dbCategories = customCats
          .filter(c => !systemKeys.includes(c.key) && !excludedCategories.includes(c.key.toLowerCase()))
          .map(c => ({
            key: c.key,
            label: c.label,
            icon: getIconFromKey(c.icon)
          }));
        
        // System categories first, then database categories
        setCategories([...systemCategories, ...dbCategories]);
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
            <Bot className="h-5 w-5" />
            <span className="font-medium">Automação</span>
          </Link>
        </div>
        
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Categorias
        </h2>
        
        {/* Category Links */}
        <nav className="space-y-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            
            // If we have an onCategorySelect handler, use button, otherwise use Link
            if (onCategorySelect && isOnLoja) {
              return (
                <button
                  key={cat.key}
                  onClick={() => handleClick(cat.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    isActive 
                      ? 'bg-red-50 text-red-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{cat.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            }
            
            return (
              <Link
                key={cat.key}
                to={cat.key === 'all' ? '/loja' : `/loja?category=${cat.key}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-red-50 text-red-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{cat.label}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
