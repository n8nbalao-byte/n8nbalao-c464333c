import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StarryBackground } from "@/components/StarryBackground";
import { ProductCard } from "@/components/ProductCard";
import { HardwareCard } from "@/components/HardwareCard";
import { api, type Product, type HardwareItem, getCustomCategories } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { Search, ArrowUpDown, Package, Cpu, ChevronLeft } from "lucide-react";

type ProductType = 'all' | 'hardware' | string;

const hardwareCategories = [
  { key: 'processor', label: 'Processadores', icon: Cpu },
  { key: 'motherboard', label: 'Placas-mãe', icon: Cpu },
  { key: 'memory', label: 'Memórias', icon: Cpu },
  { key: 'storage', label: 'Armazenamento', icon: Cpu },
  { key: 'gpu', label: 'Placas de Vídeo', icon: Cpu },
  { key: 'cooler', label: 'Coolers', icon: Cpu },
  { key: 'psu', label: 'Fontes', icon: Cpu },
  { key: 'case', label: 'Gabinetes', icon: Cpu },
];

export default function Loja() {
  const [products, setProducts] = useState<Product[]>([]);
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<ProductType>("all");
  const [selectedHardwareCategory, setSelectedHardwareCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [productTypes, setProductTypes] = useState<{ key: ProductType; label: string; icon: React.ElementType }[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [productsData, hardwareData, customCategories] = await Promise.all([
        api.getProducts(),
        api.getHardware(),
        getCustomCategories()
      ]);
      setProducts(productsData);
      setHardware(hardwareData);
      
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
      
      return matchesSearch && matchesCategory;
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
    }
  };

  const handleHardwareCategorySelect = (category: string) => {
    setSelectedHardwareCategory(category);
  };

  const isHardwareMode = selectedType === 'hardware';

  return (
    <div className="min-h-screen bg-transparent relative">
      <StarryBackground />
      <Header />

      <main className="py-12">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground">Nossa Loja</h1>
            <p className="mt-2 text-muted-foreground">
              Escolha o produto ideal para suas necessidades
            </p>
          </div>

          {/* Product Type Tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {productTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.key}
                  onClick={() => handleTypeSelect(type.key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 font-medium transition-colors ${
                    selectedType === type.key
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Hardware Subcategories */}
          {isHardwareMode && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {selectedHardwareCategory && (
                  <button
                    onClick={() => setSelectedHardwareCategory(null)}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </button>
                )}
                {hardwareCategories.map((cat) => {
                  const count = hardware.filter(h => h.category === cat.key).length;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => handleHardwareCategorySelect(cat.key)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                        selectedHardwareCategory === cat.key
                          ? "bg-accent text-accent-foreground"
                          : "bg-card border border-border text-foreground hover:bg-card/80"
                      }`}
                    >
                      {cat.label}
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={isHardwareMode ? "Buscar hardware..." : "Buscar produtos..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="asc">Menor preço</option>
                <option value="desc">Maior preço</option>
              </select>
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-card" />
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
                  <p className="text-xl text-muted-foreground">
                    Nenhum hardware encontrado nesta categoria.
                  </p>
                </div>
              )
            ) : (
              <div className="py-20 text-center">
                <p className="text-xl text-muted-foreground">
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
                <p className="text-xl text-muted-foreground">
                  Nenhum produto encontrado.
                </p>
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
