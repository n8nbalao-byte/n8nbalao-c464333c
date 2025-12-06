import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { ProductCard } from "@/components/ProductCard";
import { api, type Product } from "@/lib/api";
import { Check, MessageCircle, Zap, Clock, Brain, Mic, Shield, Users } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Atendimento 24/7",
    description: "Nunca mais perca um cliente. Seu bot responde a qualquer hora, em qualquer dia.",
    detail: "Com nosso bot, você nunca fecha! Atenda clientes de madrugada, finais de semana e feriados sem custo adicional."
  },
  {
    icon: Zap,
    title: "Resposta Imediata",
    description: "Atendimento instantâneo sem filas de espera, mesmo com alto volume de mensagens.",
    detail: "Resposta em menos de 2 segundos! Seus clientes não esperam e você não perde vendas."
  },
  {
    icon: Brain,
    title: "IA Avançada",
    description: "Inteligência artificial treinada para entender perguntas complexas e contextos variados.",
    detail: "IA que entende contexto e lembra conversas. Atendimento humano, mas automatizado!"
  },
  {
    icon: Mic,
    title: "Áudio Humanizado",
    description: "Respostas em áudio com voz natural e entonação humana para melhor experiência.",
    detail: "Áudios com voz profissional e natural que engajam seus clientes."
  },
];

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Dono de E-commerce",
    text: "O WhatsAppBot revolucionou meu atendimento. Minhas vendas aumentaram 40% no primeiro mês!",
    avatar: "CS"
  },
  {
    name: "Maria Santos",
    role: "Consultora de Vendas",
    text: "Antes eu perdia clientes por não conseguir responder rápido. Agora o bot faz isso por mim 24/7.",
    avatar: "MS"
  },
  {
    name: "João Oliveira",
    role: "Empresário",
    text: "A inteligência artificial entende perfeitamente o contexto das conversas. Impressionante!",
    avatar: "JO"
  },
];

const stats = [
  { value: "+1.988", label: "Clientes Ativos" },
  { value: "98%", label: "Satisfação" },
  { value: "24/7", label: "Atendimento" },
];

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const data = await api.getProducts();
      setProducts(data.slice(0, 3)); // Show only 3 featured products
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute left-0 top-20 opacity-30">
          <img 
            src="https://www.n8nbalao.com/images/robo.png" 
            alt="Robot" 
            className="h-48 w-auto animate-float"
          />
        </div>
        
        <div className="container relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="inline-block rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary">
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
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                >
                  <MessageCircle className="h-5 w-5" />
                  Assine
                </a>
                <a
                  href="https://wa.me/5519981470446"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-primary bg-transparent px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
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
              <img
                src="https://www.n8nbalao.com/images/celular.png"
                alt="WhatsApp Bot Demo"
                className="relative z-10 max-w-sm rounded-3xl shadow-2xl"
              />
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 rounded-xl bg-card p-4 shadow-card">
                <h4 className="font-semibold text-foreground">WhatsappBot</h4>
                <p className="text-sm text-muted-foreground">Seu assistente virtual inteligente para WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
              Por que escolher o <span className="text-primary">WhatsAppBot IA</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Nossa solução oferece recursos exclusivos que transformam seu atendimento e aumentam suas conversões.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group rounded-xl border border-border bg-background p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-glow"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/20 p-3">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Nossos Planos</h2>
              <p className="mt-2 text-muted-foreground">Escolha o plano ideal para seu negócio</p>
            </div>
            <Link
              to="/loja"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Ver todos
              <span>→</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum produto disponível no momento.
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">O que nossos clientes dizem</h2>
            <p className="mt-4 text-muted-foreground">Depoimentos de quem já transformou seu negócio</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-xl border border-border bg-background p-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20">
        <div className="container">
          <div className="rounded-2xl gradient-primary p-12 text-center">
            <h2 className="text-3xl font-bold text-primary-foreground lg:text-4xl">
              Pronto para automatizar seu atendimento?
            </h2>
            <p className="mt-4 text-primary-foreground/80">
              Comece agora e transforme seu WhatsApp em uma máquina de vendas
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/5519981470446"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-background px-6 py-3 font-semibold text-primary transition-colors hover:bg-background/90"
              >
                <MessageCircle className="h-5 w-5" />
                Falar com Consultor
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
