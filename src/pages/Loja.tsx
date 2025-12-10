import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductCard } from "@/components/ProductCard";
import { HardwareCard } from "@/components/HardwareCard";
import { CategorySidebar } from "@/components/CategorySidebar";
import { HomeCarousel } from "@/components/HomeCarousel";
import { api, type Product, type HardwareItem, getCategories, type Category } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { Search, ArrowUpDown, Package, Cpu, ShoppingCart, Building2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useCompany } from "@/contexts/CompanyContext";
import { ViewModeSelector } from "@/components/ViewModeSelector";
import LorenzoChatWidget from "@/components/LorenzoChatWidget";

type ProductType = 'all' | 'hardware' | string;

export default function Loja() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || "");
  const [selectedType, setSelectedType] = useState<ProductType>(searchParams.get('category') || "all");
  const [selectedHardwareCategory, setSelectedHardwareCategory] = useState<string | null>(searchParams.get('subcategory') || null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [hardwareSubcategories, setHardwareSubcategories] = useState<Category[]>([]);
  const { totalItems, setIsOpen } = useCart();
  const { company } = useCompany();

  useEffect(() => {
    async function fetchData() {
      const [productsData, hardwareData, hwSubcategories] = await Promise.all([
        api.getProducts(),
        api.getHardware(),
        getCategories({ parent: 'hardware' })
      ]);
      setProducts(productsData);
      setHardware(hardwareData);
      setHardwareSubcategories(hwSubcategories);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Get current hardware category definition
  const currentHardwareCategory = hardwareSubcategories.find(c => c.key === selectedHardwareCategory);

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
    } else if (type === 'hardware' && selectedHardwareCategory) {
      setSearchParams({ category: type, subcategory: selectedHardwareCategory });
    } else {
      setSearchParams({ category: type });
    }
  };

  const handleHardwareCategorySelect = (category: string | null) => {
    setSelectedHardwareCategory(category);
    setSelectedFilters({});
    // Update URL with subcategory
    if (category) {
      setSearchParams({ category: 'hardware', subcategory: category });
    } else {
      setSearchParams({ category: 'hardware' });
    }
  };

  // Sync URL params with state
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    
    if (categoryParam && categoryParam !== selectedType) {
      setSelectedType(categoryParam);
    }
    if (subcategoryParam !== selectedHardwareCategory) {
      setSelectedHardwareCategory(subcategoryParam);
    }
  }, [searchParams]);

  // Sync URL params with state
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categoryParam !== selectedType) {
      setSelectedType(categoryParam);
    }
  }, [searchParams]);

  const isHardwareMode = selectedType === 'hardware';
  const { viewMode } = useViewMode();

  // Get grid classes based on view mode
  const getGridClass = () => {
    switch (viewMode) {
      case 'list':
        return 'flex flex-col gap-4';
      case 'compact':
        return 'grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
      default:
        return 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

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
              {company?.logo ? (
                <img src={company.logo} alt={company.name || 'Logo'} className="h-12 md:h-16 object-contain" />
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 className="h-12 w-12 text-primary" />
                  <span className="font-bold text-xl text-gray-800">{company?.name || 'Sua Empresa'}</span>
                </div>
              )}
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
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <CategorySidebar 
          onCategorySelect={handleTypeSelect}
          selectedCategory={selectedType}
          selectedSubcategory={selectedHardwareCategory || undefined}
          onSubcategorySelect={handleHardwareCategorySelect}
        />

        {/* Main Content */}
        <main className="flex-1 py-8 px-6 bg-gray-50">
          {/* Category Banner - shows when a category is selected */}
          {selectedType !== 'all' && (
            <div className="mb-6">
              <HomeCarousel
                carouselKey={`category_${selectedType}_banner`}
                alt={`Banner ${selectedType}`}
                className="rounded-xl w-full h-auto max-h-[200px] object-cover"
              />
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Nossa Loja</h1>
              <p className="mt-2 text-gray-600">
                Escolha o produto ideal para suas necessidades
              </p>
            </div>
            <ViewModeSelector />
          </div>

          {/* Hardware Subcategories */}
          {isHardwareMode && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {/* "Todos" button for hardware - shows all hardware */}
                <button
                  onClick={() => setSelectedHardwareCategory(null)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                    !selectedHardwareCategory
                      ? "text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  style={!selectedHardwareCategory ? { backgroundColor: '#DC2626' } : {}}
                >
                  Todos
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626' }}>
                    {hardware.length}
                  </span>
                </button>
                {hardwareSubcategories.map((cat) => {
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
            // Hardware Grid - shows all hardware by default, or filtered by subcategory
            filteredHardware.length > 0 ? (
              <div className={getGridClass()}>
                {filteredHardware.map((item) => (
                  <HardwareCard key={item.id} hardware={item} showBuyButton />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-xl text-gray-500">
                  Nenhum hardware encontrado.
                </p>
              </div>
            )
          ) : (
            // Products Grid
            filteredProducts.length > 0 ? (
              <div className={getGridClass()}>
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
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              {company?.logo ? (
                <img src={company.logo} alt={company.name || 'Logo'} className="h-12 mb-4 brightness-0 invert object-contain" />
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-8 w-8 text-white" />
                  <span className="font-bold text-white">{company?.name || 'Sua Empresa'}</span>
                </div>
              )}
              <p className="text-gray-400 text-sm">
                {company?.name || 'Sua loja'} - Computadores, notebooks, hardware e muito mais.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Navegação</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Início</Link></li>
                <li><Link to="/loja" className="hover:text-white transition-colors">Loja</Link></li>
                <li><Link to="/monte-voce-mesmo" className="hover:text-white transition-colors">Monte seu PC</Link></li>
                <li><Link to="/loja?category=fluxos_n8n" className="hover:text-white transition-colors">Fluxos n8n</Link></li>
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

      {/* Lorenzo Chat Widget */}
      <LorenzoChatWidget />
    </div>
  );
}