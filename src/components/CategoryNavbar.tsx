import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getCustomCategories, type CustomCategory } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { Package, Cpu, Monitor, Laptop, Bot, Code, Wrench, Key, Tv, Armchair, HardDrive } from "lucide-react";

// Base categories that are always available
const baseCategories = [
  { key: 'all', label: 'Todos', icon: Package },
  { key: 'hardware', label: 'Hardware', icon: HardDrive },
  { key: 'pc', label: 'PCs Montados', icon: Monitor },
  { key: 'kit', label: 'Kits', icon: Package },
  { key: 'notebook', label: 'Notebooks', icon: Laptop },
  { key: 'automacao', label: 'Automações', icon: Bot },
  { key: 'software', label: 'Softwares', icon: Code },
  { key: 'acessorio', label: 'Acessórios', icon: Wrench },
  { key: 'licenca', label: 'Licenças', icon: Key },
  { key: 'monitor', label: 'Monitores', icon: Tv },
  { key: 'cadeira_gamer', label: 'Cadeiras Gamer', icon: Armchair },
];

interface CategoryNavbarProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
  showMonteSeuPC?: boolean;
}

export function CategoryNavbar({ onCategorySelect, selectedCategory, showMonteSeuPC = true }: CategoryNavbarProps) {
  const [categories, setCategories] = useState(baseCategories);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Determine active category from props or URL
  const activeCategory = selectedCategory || searchParams.get('category') || 'all';

  useEffect(() => {
    async function loadCategories() {
      try {
        const customCats = await getCustomCategories();
        const excludedCategories = ['games', 'console', 'controle', 'controles'];
        
        // Filter out duplicates and excluded categories
        const baseKeys = baseCategories.map(c => c.key);
        const newCustomCats = customCats
          .filter(c => !baseKeys.includes(c.key) && !excludedCategories.includes(c.key.toLowerCase()))
          .map(c => ({
            key: c.key,
            label: c.label,
            icon: getIconFromKey(c.icon)
          }));
        
        setCategories([...baseCategories, ...newCustomCats]);
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
    <nav className="bg-gray-100 border-t border-gray-200 py-3">
      <div className="container">
        <div className="flex flex-wrap items-center gap-2">
          {/* Monte seu PC - special link */}
          {showMonteSeuPC && (
            <Link
              to="/monte-voce-mesmo"
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap font-medium text-gray-700 hover:bg-white"
            >
              <Cpu className="h-4 w-4" />
              Monte seu PC
            </Link>
          )}
          
          {/* Category buttons */}
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            
            // If we have an onCategorySelect handler, use button, otherwise use Link
            if (onCategorySelect && isOnLoja) {
              return (
                <button
                  key={cat.key}
                  onClick={() => handleClick(cat.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap font-medium ${
                    isActive ? 'bg-white' : 'text-gray-700 hover:bg-white'
                  }`}
                  style={isActive ? { color: '#DC2626' } : {}}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </button>
              );
            }
            
            return (
              <Link
                key={cat.key}
                to={cat.key === 'all' ? '/loja' : `/loja?category=${cat.key}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  isActive ? 'bg-white' : 'text-gray-700 hover:bg-white'
                }`}
                style={isActive ? { color: '#DC2626' } : {}}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
