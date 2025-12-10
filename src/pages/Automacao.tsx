import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { StarryBackground } from "@/components/StarryBackground";
import { HomeCarousel } from "@/components/HomeCarousel";
import n8nLogo from "@/assets/n8n-logo.svg";

import { BenefitsCarousel } from "@/components/BenefitsCarousel";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { IntegrationsCarousel } from "@/components/IntegrationsCarousel";
import { ProductCard } from "@/components/ProductCard";
import { api, type Product, getCustomCategories } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { MessageCircle, Download, Monitor, Package, Laptop, Bot, Code, Wrench, Key, Tv, Armchair, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

const stats = [
  { value: "+1.988", label: "Clientes Ativos" },
  { value: "98%", label: "Satisfação" },
  { value: "24/7", label: "Atendimento" },
];

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

export default function Automacao() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryConfig, setCategoryConfig] = useState(baseCategoryConfig);
  const { totalItems, setIsOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const customer = localStorage.getItem("customer");
    setIsLoggedIn(!!customer);
  }, [location.pathname]);

  useEffect(() => {
    async function fetchData() {
      const [data, customCategories] = await Promise.all([
        api.getProducts(),
        getCustomCategories()
      ]);
      // Sort by price (cheapest to most expensive)
      setProducts(data.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0)));
      
      // Merge base categories with custom categories
      setCategoryConfig([
        ...baseCategoryConfig,
        ...customCategories.map(c => ({ key: c.key, label: c.label, icon: getIconFromKey(c.icon) }))
      ]);
      
      setLoading(false);
    }
    fetchData();
  }, []);

  // Only get n8n/automacao products
  const getN8nProducts = () => {
    return products.filter(p => {
      const pType = (p.productType || '').toLowerCase();
      const hasCategory = p.categories?.some(c => 
        c.toLowerCase() === 'n8n' || c.toLowerCase() === 'automacao'
      );
      return pType === 'n8n' || pType === 'automacao' || hasCategory;
    }).slice(0, 8);
  };

  // Pink/coral color matching the n8n logo (#EA4B71)
  const accentColor = "#EA4B71";

  return (
    <div className="min-h-screen relative dark" style={{ "--accent-automacao": accentColor } as React.CSSProperties}>
      <StarryBackground />
      
      {/* Custom Header for Automacao with n8n logo */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={n8nLogo} alt="n8n Balão" className="h-8 object-contain" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Início</Link>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Preços</a>
            <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Benefícios</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Depoimentos</a>
            <Link to="/loja?category=automacao" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Loja</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(isLoggedIn ? "/meus-pedidos" : "/cliente")}
              title={isLoggedIn ? "Meus Pedidos" : "Entrar"}
            >
              <User className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(true)}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>
      
      <Sidebar accentColor={accentColor} />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div 
                className="inline-block rounded-full px-4 py-2 text-sm font-medium border"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor, borderColor: `${accentColor}50` }}
              >
                AUTOMATIZE SEU ATENDIMENTO
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-white lg:text-6xl">
                Transforme seu{" "}
                <span style={{ color: accentColor }}>WhatsApp</span> em uma máquina de vendas automática
              </h1>
              
              <p className="text-lg text-gray-400">
                Não perca mais vendas por falta de atendimento. Nosso chatbot com IA avançada 
                responde suas mensagens 24/7, atende múltiplos clientes simultaneamente e 
                aumenta suas conversões.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
                  style={{ backgroundColor: accentColor, boxShadow: `0 0 30px ${accentColor}40` }}
                >
                  <Download className="h-5 w-5" />
                  Download
                </a>
                <a
                  href="https://wa.me/5519981470446"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border bg-transparent px-6 py-3 text-sm font-semibold transition-all hover:scale-105"
                  style={{ borderColor: accentColor, color: accentColor }}
                >
                  <MessageCircle className="h-5 w-5" />
                  Fale Conosco
                </a>
              </div>

              <div className="flex gap-8 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl font-bold" style={{ color: accentColor }}>{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="relative">
                <HomeCarousel
                  carouselKey="automacao_phone_carousel"
                  fallbackImage="https://meuwhatsappbot.com.br/images/celular.png"
                  className="relative z-10 max-w-sm drop-shadow-2xl"
                  imageClassName="relative z-10 max-w-sm rounded-3xl drop-shadow-2xl"
                  alt="WhatsApp Bot Demo"
                />
                {/* Glow effect behind phone */}
                <div className="absolute inset-0 -z-10 blur-3xl rounded-full scale-75" style={{ backgroundColor: `${accentColor}30` }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Carousel Section */}
      <section id="benefits">
        <BenefitsCarousel accentColor={accentColor} />
      </section>

      {/* No-Code Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white lg:text-4xl">
                <span style={{ color: accentColor }}>Nós criamos</span> toda a automação para você
              </h2>
              <p className="text-gray-400">
                Não se preocupe com a parte técnica. Nossa equipe configura todo o sistema de 
                atendimento automatizado para você. Foque no que realmente importa: seu negócio.
              </p>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: accentColor }}>•</span>
                  <span><strong className="text-white">Configuração Completa</strong> - Criamos todos os fluxos de conversação do zero</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: accentColor }}>•</span>
                  <span><strong className="text-white">Sua Identidade</strong> - Personalizamos o bot com a cara da sua marca</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: accentColor }}>•</span>
                  <span><strong className="text-white">Tudo Integrado</strong> - Conectamos com seu CRM, planilhas e sistemas</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold" style={{ color: accentColor }}>•</span>
                  <span><strong className="text-white">Suporte Contínuo</strong> - Acompanhamos e otimizamos sua automação</span>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <HomeCarousel
                carouselKey="nocode_section"
                alt="Interface No-Code"
                className="rounded-xl shadow-card"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20" style={{ backgroundColor: "rgba(30, 30, 50, 0.3)" }}>
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white lg:text-4xl mb-4">
            Deixe a complexidade com a gente
          </h2>
          <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
            Enquanto você foca em vender e atender seus clientes, nós cuidamos de toda a tecnologia 
            por trás da sua automação. Sem dor de cabeça, sem complicação.
          </p>
          <div className="max-w-5xl mx-auto">
            <HomeCarousel
              carouselKey="workflow_section"
              alt="Exemplo de workflow"
              className="rounded-xl shadow-card w-full"
            />
          </div>
        </div>
      </section>

      {/* Integrations Carousel */}
      <IntegrationsCarousel accentColor={accentColor} />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel accentColor={accentColor} />

      {/* Custom Plan CTA */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center rounded-2xl backdrop-blur-sm border p-8 lg:p-12" style={{ backgroundColor: "rgba(30, 30, 50, 0.5)", borderColor: "rgba(255,255,255,0.1)" }}>
            <div>
              <img
                src="https://meuwhatsappbot.com.br/images/team.png"
                alt="Nossa Equipe"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white lg:text-4xl">
                Precisa de um plano personalizado para sua empresa?
              </h2>
              <p className="text-gray-400">
                Nossa equipe especializada está pronta para criar a solução perfeita para o seu negócio
              </p>
              <a
                href="https://wa.me/5519981470446"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all hover:opacity-90 hover:scale-105"
                style={{ backgroundColor: accentColor }}
              >
                <MessageCircle className="h-5 w-5" />
                Entre em contato
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Products/Pricing Section - Only n8n/automacao products */}
      <section id="pricing" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white lg:text-4xl">
              Nossos Produtos
            </h2>
            <p className="mt-4 text-gray-400">
              Soluções de automação para seu negócio
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl" style={{ backgroundColor: "rgba(30, 30, 50, 0.5)" }} />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {getN8nProducts().map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
              
              {getN8nProducts().length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  Nenhum produto de automação disponível no momento.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20">
        <div className="container">
          <div className="rounded-2xl p-12 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accentColor} 0%, #a855f7 100%)` }}>
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white lg:text-4xl">
                Pronto para automatizar seu atendimento?
              </h2>
              <p className="mt-4 text-white/80 max-w-2xl mx-auto">
                Comece agora e transforme seu WhatsApp em uma máquina de vendas
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="https://wa.me/5519981470446"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold transition-all hover:bg-white/90 hover:scale-105"
                  style={{ color: accentColor }}
                >
                  <MessageCircle className="h-5 w-5" />
                  Falar com Consultor
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
