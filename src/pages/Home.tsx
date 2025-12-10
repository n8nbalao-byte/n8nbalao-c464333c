import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Product, type HardwareItem, getCategories, type Category } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { ChevronRight, Cpu, Package, Search, Building2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useViewMode } from "@/contexts/ViewModeContext";
import { useCompany } from "@/contexts/CompanyContext";
import { ViewModeSelector } from "@/components/ViewModeSelector";
import { Button } from "@/components/ui/button";
import { HomeCarousel } from "@/components/HomeCarousel";
import { CategorySidebar } from "@/components/CategorySidebar";
import LorenzoChatWidget from "@/components/LorenzoChatWidget";

interface CategoryConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryConfig, setCategoryConfig] = useState<CategoryConfig[]>([]);
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
  const { addToCart } = useCart();
  const { viewMode } = useViewMode();
  const { company } = useCompany();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminChoice, setShowAdminChoice] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [productsData, hardwareData, dbCategories] = await Promise.all([
        api.getProducts(),
        api.getHardware(),
        getCategories({ parent: null }) // Get only top-level categories from database
      ]);
      setProducts(productsData.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0)));
      setHardware(hardwareData);
      
      // Use only categories from database - no more hardcoded baseCategoryConfig
      const validCategories: CategoryConfig[] = dbCategories.map((c: Category) => ({
        key: c.key,
        label: c.label,
        icon: getIconFromKey(c.icon || 'Package')
      }));
      
      setCategoryConfig(validCategories);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const getProductsByCategory = (category: string) => {
    if (category === 'hardware') {
      // Return hardware items as products
      return hardware.slice(0, 6).map(h => ({
        id: `hw_${h.id}`,
        title: h.name,
        subtitle: `${h.brand} ${h.model}`,
        totalPrice: h.price,
        media: h.image ? [{ type: 'image' as const, url: h.image }] : [],
        productType: 'hardware',
        isHardware: true,
        hardwareId: h.id
      }));
    }
    return products
      .filter(p => p.productType === category || p.categories?.includes(category))
      .slice(0, 6);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    
    // Secret code - show choice dialog
    if (query.toLowerCase() === 'admin010203') {
      setShowAdminChoice(true);
      setSearchQuery('');
      return;
    }
    
    if (query) {
      window.location.href = `/loja?search=${encodeURIComponent(query)}`;
    }
  };

  const handleAdminChoice = (choice: 'admin' | 'extrator') => {
    setShowAdminChoice(false);
    if (choice === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/extract-products';
    }
  };

  const getGridClasses = () => {
    switch (viewMode) {
      case 'compact':
        return 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3';
      case 'list':
        return 'flex flex-col gap-3';
      default:
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4';
    }
  };

  const renderProductCard = (product: any, isHardware = false) => {
    const productId = isHardware ? product.hardwareId : product.id;
    const linkTo = isHardware ? `/hardware/${productId}` : `/produto/${productId}`;
    const isHovered = hoveredProduct === (isHardware ? `hw_${productId}` : productId);
    const hoverKey = isHardware ? `hw_${productId}` : productId;

    if (viewMode === 'list') {
      return (
        <Link
          key={product.id}
          to={linkTo}
          className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden flex items-center gap-4 p-4"
          onMouseEnter={() => setHoveredProduct(hoverKey)}
          onMouseLeave={() => setHoveredProduct(null)}
        >
          <div className="w-24 h-24 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
            {product.media && product.media.length > 0 ? (
              <img
                src={product.media[0].type === 'video' && product.media[0].url.includes('youtube')
                  ? `https://img.youtube.com/vi/${product.media[0].url.split('v=')[1]?.split('&')[0] || product.media[0].url.split('/').pop()}/0.jpg`
                  : product.media[0].url}
                alt={product.title}
                className={`w-full h-full object-contain transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
              {product.title}
            </h3>
            {product.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{product.subtitle}</p>
            )}
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">
              R$ {(product.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Link>
      );
    }

    if (viewMode === 'compact') {
      return (
        <Link
          key={product.id}
          to={linkTo}
          className="group bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden relative"
          onMouseEnter={() => setHoveredProduct(hoverKey)}
          onMouseLeave={() => setHoveredProduct(null)}
        >
          <div className="aspect-square bg-gray-50 p-2 relative overflow-hidden">
            {product.media && product.media.length > 0 ? (
              <img
                src={product.media[0].type === 'video' && product.media[0].url.includes('youtube')
                  ? `https://img.youtube.com/vi/${product.media[0].url.split('v=')[1]?.split('&')[0] || product.media[0].url.split('/').pop()}/0.jpg`
                  : product.media[0].url}
                alt={product.title}
                className={`w-full h-full object-contain transition-all duration-300 ${isHovered ? 'scale-110 opacity-100' : 'opacity-80'}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Package className="h-8 w-8" />
              </div>
            )}
            {/* Overlay with product info on hover */}
            <div className={`absolute inset-0 bg-black/70 flex flex-col justify-end p-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <h3 className="text-xs font-medium text-white line-clamp-2">
                {product.title}
              </h3>
              <span className="text-sm font-bold text-primary mt-1">
                R$ {(product.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="p-2">
            <span className="text-xs font-bold text-primary">
              R$ {(product.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Link>
      );
    }

    // Standard view
    return (
      <Link
        key={product.id}
        to={linkTo}
        className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden"
        onMouseEnter={() => setHoveredProduct(hoverKey)}
        onMouseLeave={() => setHoveredProduct(null)}
      >
        <div className="aspect-square bg-gray-50 p-4 relative overflow-hidden">
          {product.media && product.media.length > 0 ? (
            <img
              src={product.media[0].type === 'video' && product.media[0].url.includes('youtube')
                ? `https://img.youtube.com/vi/${product.media[0].url.split('v=')[1]?.split('&')[0] || product.media[0].url.split('/').pop()}/0.jpg`
                : product.media[0].url}
              alt={product.title}
              className={`w-full h-full object-contain transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Package className="h-12 w-12" />
            </div>
          )}
          {/* Hover overlay showing image larger */}
          {isHovered && product.media && product.media.length > 0 && (
            <div className="absolute inset-0 bg-white/95 flex items-center justify-center p-2 animate-fade-in">
              <img
                src={product.media[0].type === 'video' && product.media[0].url.includes('youtube')
                  ? `https://img.youtube.com/vi/${product.media[0].url.split('v=')[1]?.split('&')[0] || product.media[0].url.split('/').pop()}/0.jpg`
                  : product.media[0].url}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px]">
            {product.title}
          </h3>
          <div className="mt-2">
            <span className="text-lg font-bold text-primary">
              R$ {(product.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Admin Choice Modal */}
      {showAdminChoice && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Onde deseja ir?</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleAdminChoice('admin')}
                className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Painel Administrativo
              </button>
              <button
                onClick={() => handleAdminChoice('extrator')}
                className="w-full py-3 px-4 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Extrator de Produtos
              </button>
              <button
                onClick={() => setShowAdminChoice(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Top Bar */}
      <div className="bg-primary text-white py-2 text-sm">
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
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquise seu produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-primary rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-lg hover:bg-primary/90 transition-colors">
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Monte seu PC */}
            <Link to="/monte-voce-mesmo" className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
              <Cpu className="h-5 w-5" />
              <span className="hidden md:inline font-medium">Monte seu PC</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar */}
        <CategorySidebar />

        {/* Main Content */}
        <div className="flex-1 px-4 md:px-6 lg:px-8">
          {/* Hero Banner Carousel */}
          <section className="py-4">
            <HomeCarousel
              carouselKey="home_hero_banner"
              fallbackImage="https://img.terabyteshop.com.br/banner/3732.jpg"
              alt="Banner Principal"
              className="w-full aspect-[3/1] md:aspect-[4/1] object-cover rounded-xl"
            />
          </section>

          {/* Promo Banners */}
          <section className="pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HomeCarousel
                carouselKey="home_promo_left"
                fallbackImage="https://img.terabyteshop.com.br/banner/2390.jpg"
                alt="Promoção"
                className="w-full aspect-[2/1] rounded-xl object-cover"
              />
              <HomeCarousel
                carouselKey="home_promo_right"
                fallbackImage="https://img.terabyteshop.com.br/banner/3773.jpg"
                alt="Promoção"
                className="w-full aspect-[2/1] rounded-xl object-cover"
              />
            </div>
          </section>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-end gap-2 pb-4 border-b border-gray-100 mb-4">
            <ViewModeSelector />
          </div>

          {/* Featured Products by Category */}
          {loading ? (
            <section className="py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            </section>
          ) : (
            <>
              {categoryConfig.map((category) => {
                const categoryProducts = getProductsByCategory(category.key);
                if (categoryProducts.length === 0) return null;
                
                const Icon = category.icon;
                const isHardwareCategory = category.key === 'hardware';
                
                return (
                  <section key={category.key} className="py-6 border-t border-gray-100">
                    {/* Category Banner */}
                    <div className="mb-4">
                      <HomeCarousel
                        carouselKey={`category_${category.key}_banner`}
                        fallbackImage=""
                        alt={`Banner ${category.label}`}
                        className="w-full aspect-[6/1] rounded-xl object-cover"
                      />
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary" />
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">{category.label}</h2>
                      </div>
                      <Link to={`/loja?category=${category.key}`} className="flex items-center gap-1 text-primary hover:underline font-medium text-sm">
                        Ver mais
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                    
                    <div className={getGridClasses()}>
                      {categoryProducts.map((product: any) => renderProductCard(product, isHardwareCategory))}
                    </div>
                  </section>
                );
              })}
            </>
          )}

          {/* CTA Banner */}
          <section className="py-12 bg-primary rounded-xl my-8">
            <div className="text-center px-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Monte o PC dos seus sonhos!
              </h2>
              <p className="text-white/80 mb-6 max-w-2xl mx-auto">
                Escolha cada componente e tenha o PC perfeito para suas necessidades
              </p>
              <Link
                to="/monte-voce-mesmo"
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
              >
                <Cpu className="h-5 w-5" />
                Monte Agora
              </Link>
            </div>
          </section>
        </div>
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

      {/* Lorenzo Chat Widget */}
      <LorenzoChatWidget />
    </div>
  );
}
