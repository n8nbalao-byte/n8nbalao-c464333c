import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StarryBackground } from "@/components/StarryBackground";
import { ProductCard } from "@/components/ProductCard";
import { api, type Product, getCustomCategories } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { Search, ArrowUpDown, Monitor, Package, Laptop, Bot, Wrench, Code, Key, Tv, Armchair } from "lucide-react";

type ProductType = 'all' | 'pc' | 'kit' | 'notebook' | 'automacao' | 'software' | 'acessorio' | 'licenca' | 'monitor' | 'cadeira_gamer' | string;

const baseProductTypes: { key: ProductType; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Todos', icon: Package },
  { key: 'pc', label: 'PCs', icon: Monitor },
  { key: 'kit', label: 'Kits', icon: Package },
  { key: 'notebook', label: 'Notebooks', icon: Laptop },
  { key: 'automacao', label: 'Automações', icon: Bot },
  { key: 'software', label: 'Softwares', icon: Code },
  { key: 'acessorio', label: 'Acessórios', icon: Wrench },
  { key: 'licenca', label: 'Licenças', icon: Key },
  { key: 'monitor', label: 'Monitores', icon: Tv },
  { key: 'cadeira_gamer', label: 'Cadeiras Gamer', icon: Armchair },
];

export default function Loja() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<ProductType>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [productTypes, setProductTypes] = useState(baseProductTypes);

  useEffect(() => {
    async function fetchProducts() {
      const [data, customCategories] = await Promise.all([
        api.getProducts(),
        getCustomCategories()
      ]);
      setProducts(data);
      
      // Build complete category list from custom categories AND product data
      const baseKeys = baseProductTypes.map(c => c.key);
      const customKeys = customCategories.map(c => c.key);
      
      // Extract unique categories from products
      const productCategoryKeys = data
        .map(p => p.categories?.[0] || p.productType || '')
        .filter(cat => cat && !baseKeys.includes(cat) && !customKeys.includes(cat));
      
      const uniqueProductCats = [...new Set(productCategoryKeys)].map(key => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        icon: getIconFromKey('tag')
      }));
      
      setProductTypes([
        ...baseProductTypes,
        ...customCategories.map(c => ({ key: c.key, label: c.label, icon: getIconFromKey(c.icon) })),
        ...uniqueProductCats
      ]);
      
      setLoading(false);
    }
    fetchProducts();
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
                  onClick={() => setSelectedType(type.key)}
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

          {/* Filters */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar produtos..."
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

          {/* Products Grid */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
