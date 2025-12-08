import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { HardwareCard } from "@/components/HardwareCard";
import { api, type Product, type HardwareItem, getCustomCategories, getHardwareCategories, type HardwareCategoryDef } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { Search, ArrowUpDown, Package, Cpu, ChevronLeft, ShoppingCart, Menu, HardDrive, Monitor, Laptop, Bot } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import balaoLogo from "@/assets/balao-logo.png";

type ProductType = 'all' | 'hardware' | string;

const defaultHardwareCategories: HardwareCategoryDef[] = [
  { key: 'processor', label: 'Processadores', icon: 'cpu', filters: [{ field: 'socket', label: 'Socket', options: ['LGA1700', 'LGA1200', 'LGA1155', 'LGA1150', 'LGA1151', 'AM4', 'AM5', 'AM3+'] }] },
  { key: 'motherboard', label: 'Placas-mãe', icon: 'cpu', filters: [{ field: 'socket', label: 'Socket', options: ['LGA1700', 'LGA1200', 'LGA1155', 'LGA1150', 'LGA1151', 'AM4', 'AM5', 'AM3+'] }, { field: 'memoryType', label: 'Tipo de Memória', options: ['DDR3', 'DDR4', 'DDR5'] }] },
  { key: 'memory', label: 'Memórias', icon: 'cpu', filters: [{ field: 'memoryType', label: 'Tipo de Memória', options: ['DDR3', 'DDR4', 'DDR5'] }] },
  { key: 'storage', label: 'Armazenamento', icon: 'cpu', filters: [{ field: 'formFactor', label: 'Tipo', options: ['SSD SATA', 'SSD NVMe', 'HDD'] }] },
  { key: 'gpu', label: 'Placas de Vídeo', icon: 'cpu' },
  { key: 'cooler', label: 'Coolers', icon: 'cpu' },
  { key: 'psu', label: 'Fontes', icon: 'cpu', filters: [{ field: 'tdp', label: 'Potência', options: ['500W', '600W', '700W', '800W', '1000W+'] }] },
  { key: 'case', label: 'Gabinetes', icon: 'cpu', filters: [{ field: 'formFactor', label: 'Form Factor', options: ['ATX', 'Micro-ATX', 'Mini-ITX'] }] },
];

export default function Loja() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || "");
  const [selectedType, setSelectedType] = useState<ProductType>(searchParams.get('category') || "all");
  const [selectedHardwareCategory, setSelectedHardwareCategory] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [productTypes, setProductTypes] = useState<{ key: ProductType; label: string; icon: React.ElementType }[]>([]);
  const [hardwareCategoriesList, setHardwareCategoriesList] = useState<HardwareCategoryDef[]>(defaultHardwareCategories);
  const { totalItems, setIsOpen } = useCart();

  useEffect(() => {
    async function fetchData() {
      const [productsData, hardwareData, customCategories, dbHardwareCategories] = await Promise.all([
        api.getProducts(),
        api.getHardware(),
        getCustomCategories(),
        getHardwareCategories()
      ]);
      setProducts(productsData);
      setHardware(hardwareData);
      
      // Merge default hardware categories with database ones
      const mergedHardwareCategories = [...defaultHardwareCategories];
      dbHardwareCategories.forEach(dbCat => {
        const existingIndex = mergedHardwareCategories.findIndex(c => c.key === dbCat.key);
        if (existingIndex >= 0) {
          mergedHardwareCategories[existingIndex] = { ...mergedHardwareCategories[existingIndex], ...dbCat };
        } else {
          mergedHardwareCategories.push(dbCat);
        }
      });
      setHardwareCategoriesList(mergedHardwareCategories);
      
      // Categories to exclude from display
      const excludedCategories = ['games', 'console', 'controle', 'controles'];
      
      // Build category list from database only (no fixed categories)
      const dbCategories = customCategories
        .filter(c => !excludedCategories.includes(c.key.toLowerCase()))
        .map(c => ({ 
          key: c.key, 
          label: c.label, 
          icon: getIconFromKey(c.icon) 
        }));
      
      // Always include "Todos" and "Hardware" as special system categories
      setProductTypes([
        { key: 'all', label: 'Todos', icon: Package },
        { key: 'hardware', label: 'Hardware', icon: Cpu },
        ...dbCategories
      ]);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  // Get current hardware category definition
  const currentHardwareCategory = hardwareCategoriesList.find(c => c.key === selectedHardwareCategory);

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.title.toLowerCase().includes(search.toLowerCase()) ||
        product.subtitle?.toLowerCase().includes(search.toLowerCase());
      
      // Filter by product type
      const matchesType = selectedType === "all" || 
        product.productType === selectedType ||
        product.categories?.some(cat => cat.toLowerCase() === selectedType.toLowerCase());
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return (a.totalPrice || 0) - (b.totalPrice || 0);
      }
      return (b.totalPrice || 0) - (a.totalPrice || 0);
    });

  const filteredHardware = hardware
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.brand?.toLowerCase().includes(search.toLowerCase()) ||
        item.model?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = !selectedHardwareCategory || item.category === selectedHardwareCategory;
      
      // Apply dynamic filters
      let matchesFilters = true;
      if (currentHardwareCategory?.filters && Object.keys(selectedFilters).length > 0) {
        for (const [filterKey, filterValue] of Object.entries(selectedFilters)) {
          if (filterValue && filterValue !== 'all') {
            if (filterKey === 'tdp') {
              // Special handling for power/TDP filter
              const itemTdp = item.tdp || 0;
              if (filterValue === '1000W+') {
                matchesFilters = matchesFilters && itemTdp >= 1000;
              } else {
                const targetWattage = parseInt(filterValue.replace('W', ''));
                matchesFilters = matchesFilters && itemTdp >= targetWattage - 100 && itemTdp <= targetWattage;
              }
            } else {
              // Direct field match for socket, memoryType, formFactor
              const itemValue = (item as any)[filterKey];
              matchesFilters = matchesFilters && itemValue?.toLowerCase() === filterValue.toLowerCase();
            }
          }
        }
      }
      
      return matchesSearch && matchesCategory && matchesFilters;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return (a.price || 0) - (b.price || 0);
      }
      return (b.price || 0) - (a.price || 0);
    });

  const handleTypeSelect = (type: ProductType) => {
    setSelectedType(type);
    if (type !== 'hardware') {
      setSelectedHardwareCategory(null);
      setSelectedFilters({});
    }
    // Update URL
    if (type === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: type });
    }
  };

  const handleHardwareCategorySelect = (category: string) => {
    setSelectedHardwareCategory(category);
    setSelectedFilters({});
  };

  // Sync URL params with state
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== selectedType) {
      setSelectedType(categoryParam);
    }
  }, [searchParams]);

  const isHardwareMode = selectedType === 'hardware';

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div style={{ backgroundColor: '#DC2626' }} className="text-white py-2 text-sm">
        <div className="container flex justify-between items-center">
          <span>Bem-vindo à Balão da Informática!</span>
          <div className="flex gap-4">
            <Link to="/cliente" className="hover:underline">Minha Conta</Link>
            <Link to="/meus-pedidos" className="hover:underline">Meus Pedidos</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src={balaoLogo} alt="Balão da Informática" className="h-12 md:h-16" />
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquise seu produto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#DC2626' }}
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-white p-2 rounded-lg transition-colors" style={{ backgroundColor: '#DC2626' }}>
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Cart */}
            <button 
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors relative"
              style={{ backgroundColor: '#DC2626' }}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden md:inline font-medium">Carrinho</span>
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold" style={{ color: '#DC2626' }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <nav className="bg-gray-100 border-t border-gray-200">
          <div className="container">
            <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              {productTypes.map((type) => {
                const Icon = type.icon;
                const isActive = selectedType === type.key;
                return (
                  <button
                    key={type.key}
                    onClick={() => handleTypeSelect(type.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap font-medium ${
                      isActive ? 'bg-white' : 'text-gray-700 hover:bg-white'
                    }`}
                    style={isActive ? { color: '#DC2626' } : {}}
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      <main className="py-12 bg-gray-50">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Nossa Loja</h1>
            <p className="mt-2 text-gray-600">
              Escolha o produto ideal para suas necessidades
            </p>
          </div>

          {/* Hardware Subcategories */}
          {isHardwareMode && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {selectedHardwareCategory && (
                  <button
                    onClick={() => setSelectedHardwareCategory(null)}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </button>
                )}
                {hardwareCategoriesList.map((cat) => {
                  const count = hardware.filter(h => h.category === cat.key).length;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleHardwareCategorySelect(cat.key)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                        selectedHardwareCategory === cat.key
                          ? "text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                      style={selectedHardwareCategory === cat.key ? { backgroundColor: '#DC2626' } : {}}
                    >
                      {cat.label}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Hardware Filters */}
              {selectedHardwareCategory && currentHardwareCategory?.filters && currentHardwareCategory.filters.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-gray-200">
                  {currentHardwareCategory.filters.map((filter) => (
                    <div key={filter.field} className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-600">{filter.label}:</label>
                      <select
                        value={selectedFilters[filter.field] || 'all'}
                        onChange={(e) => setSelectedFilters(prev => ({ ...prev, [filter.field]: e.target.value }))}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2"
                        style={{ ['--ring-color' as any]: '#DC2626' }}
                      >
                        <option value="all">Todos</option>
                        {filter.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sort Order */}
          <div className="mb-8 flex items-center justify-end gap-2">
            <ArrowUpDown className="h-4 w-4 text-gray-500" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2"
            >
              <option value="asc">Menor preço</option>
              <option value="desc">Maior preço</option>
            </select>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : isHardwareMode ? (
            // Hardware Grid
            selectedHardwareCategory ? (
              filteredHardware.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredHardware.map((item) => (
                    <HardwareCard key={item.id} hardware={item} showBuyButton />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-xl text-gray-500">
                    Nenhum hardware encontrado nesta categoria.
                  </p>
                </div>
              )
            ) : (
              <div className="py-20 text-center">
                <p className="text-xl text-gray-500">
                  Selecione uma subcategoria de hardware acima.
                </p>
              </div>
            )
          ) : (
            // Products Grid
            filteredProducts.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-xl text-gray-500">
                  Nenhum produto encontrado.
                </p>
              </div>
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src={balaoLogo} alt="Balão da Informática" className="h-12 mb-4 brightness-0 invert" />
              <p className="text-gray-400 text-sm">
                Sua loja de informática completa. Computadores, notebooks, hardware e muito mais.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Navegação</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Início</Link></li>
                <li><Link to="/loja" className="hover:text-white transition-colors">Loja</Link></li>
                <li><Link to="/monte-voce-mesmo" className="hover:text-white transition-colors">Monte seu PC</Link></li>
                <li><Link to="/automacao" className="hover:text-white transition-colors">Automação</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Categorias</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/loja?category=pc" className="hover:text-white transition-colors">PCs Montados</Link></li>
                <li><Link to="/loja?category=notebook" className="hover:text-white transition-colors">Notebooks</Link></li>
                <li><Link to="/loja?category=hardware" className="hover:text-white transition-colors">Hardware</Link></li>
                <li><Link to="/loja?category=acessorio" className="hover:text-white transition-colors">Acessórios</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>WhatsApp: (19) 98147-0446</li>
                <li>Email: contato@balao.info</li>
              </ul>
              <div className="mt-4">
                <Link to="/admin" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  Admin
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Balão da Informática. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}