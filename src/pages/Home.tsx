import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Product, type HardwareItem, getCustomCategories } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { ShoppingCart, ChevronRight, Cpu, HardDrive, Monitor, Package, Laptop, Bot, Code, Wrench, Key, Tv, Armchair, ChevronLeft, Search, Menu } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { HomeCarousel } from "@/components/HomeCarousel";
import balaoLogo from "@/assets/balao-logo.png";

const baseCategoryConfig = [
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryConfig, setCategoryConfig] = useState(baseCategoryConfig);
  const [currentPromoSlide, setCurrentPromoSlide] = useState(0);
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminChoice, setShowAdminChoice] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [productsData, hardwareData, customCategories] = await Promise.all([
        api.getProducts(),
        api.getHardware(),
        getCustomCategories()
      ]);
      setProducts(productsData.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0)));
      setHardware(hardwareData);
      
      setCategoryConfig([
        ...baseCategoryConfig,
        ...customCategories.map(c => ({ key: c.key, label: c.label, icon: getIconFromKey(c.icon) }))
      ]);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const getProductsByCategory = (category: string) => {
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
              <img src={balaoLogo} alt="Balão da Informática" className="h-12 md:h-16" />
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

          {/* Category Cards - Dynamic Grid */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Link 
              to="/monte-voce-mesmo" 
              className="group bg-gray-50 rounded-lg px-3 py-2 hover:bg-primary/10 transition-all border border-gray-200 flex items-center gap-2"
            >
              <Cpu className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary text-xs whitespace-nowrap">MONTE SEU PC</span>
            </Link>
            
            {categoryConfig.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link 
                  key={cat.key}
                  to={`/loja?category=${cat.key}`} 
                  className="group bg-gray-50 rounded-lg px-3 py-2 hover:bg-primary/10 transition-all border border-gray-200 flex items-center gap-2"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-primary text-xs whitespace-nowrap">{cat.label.toUpperCase()}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Hero Banner Carousel */}
      <section className="relative">
        <HomeCarousel
          carouselKey="home_hero_banner"
          fallbackImage="https://img.terabyteshop.com.br/banner/3732.jpg"
          alt="Banner Principal"
          className="w-full aspect-[3/1] md:aspect-[4/1] object-cover"
        />
      </section>

      {/* Promo Banners */}
      <section className="py-6">
        <div className="container">
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
        </div>
      </section>

      {/* Featured Products by Category */}
      {loading ? (
        <section className="py-8">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <>
          {categoryConfig.map((category) => {
            const categoryProducts = getProductsByCategory(category.key);
            if (categoryProducts.length === 0) return null;
            
            const Icon = category.icon;
            
            return (
              <section key={category.key} className="py-8 border-t border-gray-100">
                <div className="container">
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categoryProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/produto/${product.id}`}
                        className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                      >
                        <div className="aspect-square bg-gray-50 p-4">
                          {product.media && product.media.length > 0 ? (
                            <img
                              src={product.media[0].type === 'video' && product.media[0].url.includes('youtube')
                                ? `https://img.youtube.com/vi/${product.media[0].url.split('v=')[1]?.split('&')[0] || product.media[0].url.split('/').pop()}/0.jpg`
                                : product.media[0].url}
                              alt={product.title}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="h-12 w-12" />
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
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </>
      )}

      {/* CTA Banner */}
      <section className="py-12 bg-primary">
        <div className="container text-center">
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
