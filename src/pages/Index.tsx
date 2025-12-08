import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { StarryBackground } from "@/components/StarryBackground";

import { BenefitsCarousel } from "@/components/BenefitsCarousel";
import { TestimonialsCarousel } from "@/components/TestimonialsCarousel";
import { IntegrationsCarousel } from "@/components/IntegrationsCarousel";
import { ProductCard } from "@/components/ProductCard";
import { api, type Product, getCustomCategories } from "@/lib/api";
import { getIconFromKey } from "@/lib/icons";
import { MessageCircle, Download, Monitor, Package, Laptop, Bot, Code, Wrench, Key, Tv, Armchair } from "lucide-react";

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

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryConfig, setCategoryConfig] = useState(baseCategoryConfig);

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

  // Group products by category
  const getProductsByCategory = (category: string) => {
    return products
      .filter(p => p.productType === category || p.categories?.includes(category))
      .slice(0, 4);
  };

  return (
    <div className="min-h-screen relative">
      <StarryBackground />
      <Header />
      <Sidebar />
      

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="inline-block rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary border border-primary/30">
                AUTOMATIZE SEU ATENDIMENTO
              </div>
              
              <h1 className="text-4xl font-bold leading-tight text-foreground lg:text-6xl">
                Transforme seu{" "}
                <span className="text-primary">WhatsApp</span> em uma máquina de vendas automática
              </h1>
              
              <p className="text-lg text-muted-foreground">
                Não perca mais vendas por falta de atendimento. Nosso chatbot com IA avançada 
                responde suas mensagens 24/7, atende múltiplos clientes simultaneamente e 
                aumenta suas conversões.
              </p>

              <div className="flex flex-wrap gap-4">
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:bg-primary/90 hover:scale-105"
                >
                  <Download className="h-5 w-5" />
                  Download
                </a>
                <a
                  href="https://wa.me/5519981470446"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary bg-transparent px-6 py-3 text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105"
                >
                  <MessageCircle className="h-5 w-5" />
                  Fale Conosco
                </a>
              </div>

              <div className="flex gap-8 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="relative">
                <img
                  src="https://meuwhatsappbot.com.br/images/celular.png"
                  alt="WhatsApp Bot Demo"
                  className="relative z-10 max-w-sm rounded-3xl drop-shadow-2xl"
                />
                {/* Glow effect behind phone */}
                <div className="absolute inset-0 -z-10 blur-3xl bg-primary/20 rounded-full scale-75" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Carousel Section */}
      <section id="benefits">
        <BenefitsCarousel />
      </section>

      {/* No-Code Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
                Interface <span className="text-primary">No-Code</span> quando você precisa, Código quando quiser
              </h2>
              <p className="text-muted-foreground">
                Configure seu bot de WhatsApp sem escrever uma linha de código. Nossa interface visual 
                intuitiva permite criar automações poderosas em minutos.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Interface 100% No-Code</strong> - Crie fluxos de conversação arrastando e soltando</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Personalização Avançada</strong> - Adapte o bot à identidade da sua marca</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Integrações Nativas</strong> - Conecte com CRM, planilhas e sistemas externos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Respostas Inteligentes</strong> - IA que aprende com suas interações</span>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <img
                src="https://meuwhatsappbot.com.br/images/code.webp"
                alt="Interface No-Code"
                className="rounded-xl shadow-card"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-card/30">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl mb-4">
            Automatize processos complexos com facilidade
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            Crie workflows poderosos que conectam diferentes ferramentas e serviços, tudo de forma visual e intuitiva.
          </p>
          <div className="max-w-5xl mx-auto">
            <img
              src="https://meuwhatsappbot.com.br/images/workflow.png"
              alt="Exemplo de workflow"
              className="rounded-xl shadow-card w-full"
            />
          </div>
        </div>
      </section>

      {/* Integrations Carousel */}
      <IntegrationsCarousel />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* Custom Plan CTA */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-8 lg:p-12">
            <div>
              <img
                src="https://meuwhatsappbot.com.br/images/team.png"
                alt="Nossa Equipe"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
                Precisa de um plano personalizado para sua empresa?
              </h2>
              <p className="text-muted-foreground">
                Nossa equipe especializada está pronta para criar a solução perfeita para o seu negócio
              </p>
              <a
                href="https://wa.me/5519981470446"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-105"
              >
                <MessageCircle className="h-5 w-5" />
                Entre em contato
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Products/Pricing Section - Show all categories */}
      <section id="pricing" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
              Nossos Produtos
            </h2>
            <p className="mt-4 text-muted-foreground">
              Encontre o produto ideal para suas necessidades
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {categoryConfig.map((category) => {
                const categoryProducts = getProductsByCategory(category.key);
                if (categoryProducts.length === 0) return null;
                
                const Icon = category.icon;
                
                return (
                  <div key={category.key}>
                    <div className="flex items-center gap-3 mb-6">
                      <Icon className="h-6 w-6 text-primary" />
                      <h3 className="text-2xl font-bold text-foreground">{category.label}</h3>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {products.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhum produto disponível no momento.
                </div>
              )}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/loja"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Ver todos os produtos
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20">
        <div className="container">
          <div className="rounded-2xl gradient-primary p-12 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-primary-foreground lg:text-4xl">
                Pronto para automatizar seu atendimento?
              </h2>
              <p className="mt-4 text-primary-foreground/80 max-w-2xl mx-auto">
                Comece agora e transforme seu WhatsApp em uma máquina de vendas
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <a
                  href="https://wa.me/5519981470446"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 font-semibold text-primary transition-all hover:bg-background/90 hover:scale-105"
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
