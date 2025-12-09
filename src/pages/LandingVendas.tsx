import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Zap, 
  ShoppingCart, 
  Bot, 
  MessageSquare, 
  Settings, 
  Database, 
  Smartphone,
  Monitor,
  Cpu,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Star,
  ArrowRight,
  Play,
  ChevronDown
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LandingVendas = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const features = [
    {
      icon: ShoppingCart,
      title: "E-commerce Completo",
      description: "Catálogo de produtos, carrinho de compras, checkout integrado com WhatsApp. Venda 24/7 sem complicação."
    },
    {
      icon: Cpu,
      title: "Monte seu PC",
      description: "Sistema exclusivo de montagem de PCs com verificação automática de compatibilidade entre componentes."
    },
    {
      icon: Bot,
      title: "Assistente IA no Site",
      description: "Chatbot inteligente que conhece todos os produtos, preços e ajuda clientes a escolherem a melhor opção."
    },
    {
      icon: MessageSquare,
      title: "Agente IA no WhatsApp",
      description: "Automação completa via n8n. Seu WhatsApp responde clientes automaticamente consultando o banco de dados."
    },
    {
      icon: Settings,
      title: "Painel Admin Poderoso",
      description: "Gerencie produtos, clientes, pedidos, categorias, banners e configurações em um único lugar."
    },
    {
      icon: Database,
      title: "Importação em Massa",
      description: "Importe centenas de produtos de concorrentes com extração automática de dados e geração de descrições por IA."
    }
  ];

  const benefits = [
    { icon: TrendingUp, text: "Aumente suas vendas em até 300%" },
    { icon: Clock, text: "Atendimento 24/7 sem contratar equipe" },
    { icon: Users, text: "Gerencie milhares de produtos facilmente" },
    { icon: Shield, text: "Sistema seguro e escalável" },
    { icon: Smartphone, text: "100% responsivo para mobile" },
    { icon: Zap, text: "Setup rápido em menos de 24h" }
  ];

  const plans = [
    {
      name: "Starter",
      description: "Ideal para começar",
      price: billingCycle === 'monthly' ? 497 : 397,
      features: [
        "E-commerce completo",
        "Até 500 produtos",
        "Painel administrativo",
        "Checkout via WhatsApp",
        "Suporte por email",
        "1 usuário admin"
      ],
      cta: "Começar Agora",
      popular: false
    },
    {
      name: "Profissional",
      description: "Mais vendido",
      price: billingCycle === 'monthly' ? 997 : 797,
      features: [
        "Tudo do Starter +",
        "Produtos ilimitados",
        "Assistente IA no site",
        "Monte seu PC com compatibilidade",
        "Importação em massa",
        "5 usuários admin",
        "Suporte prioritário"
      ],
      cta: "Escolher Profissional",
      popular: true
    },
    {
      name: "Enterprise",
      description: "Solução completa",
      price: billingCycle === 'monthly' ? 1997 : 1597,
      features: [
        "Tudo do Profissional +",
        "Agente IA no WhatsApp",
        "Automações n8n personalizadas",
        "Email marketing integrado",
        "API para integrações",
        "Usuários ilimitados",
        "Suporte dedicado 24/7",
        "Treinamento da equipe"
      ],
      cta: "Falar com Consultor",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Carlos Silva",
      company: "TechStore SP",
      text: "Triplicamos nossas vendas em 3 meses. O assistente IA atende nossos clientes mesmo de madrugada!",
      rating: 5
    },
    {
      name: "Marina Santos",
      company: "PC Master RJ",
      text: "O sistema de montagem de PC é incrível. Os clientes montam suas configurações e já recebemos o pedido pronto.",
      rating: 5
    },
    {
      name: "Roberto Almeida",
      company: "InfoShop Curitiba",
      text: "A importação em massa me economizou semanas de trabalho. Importei 2000 produtos em uma tarde.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "Preciso de conhecimento técnico para usar?",
      answer: "Não! O sistema foi desenvolvido para ser intuitivo. Qualquer pessoa consegue gerenciar produtos, pedidos e configurações pelo painel admin. Oferecemos também treinamento completo."
    },
    {
      question: "Quanto tempo leva para configurar?",
      answer: "O setup básico leva menos de 24 horas. Nossa equipe cuida de toda a instalação, configuração do banco de dados e integração com WhatsApp."
    },
    {
      question: "O assistente IA tem custo adicional?",
      answer: "O custo da IA (OpenAI) é baseado em uso. Em média, R$ 50-150/mês dependendo do volume de atendimentos. Esse custo é muito menor que contratar um atendente."
    },
    {
      question: "Posso personalizar o visual do site?",
      answer: "Sim! Cores, logo, banners e todo o visual podem ser personalizados pelo painel admin. Para personalizações mais avançadas, oferecemos serviço de customização."
    },
    {
      question: "E se eu precisar de mais funcionalidades?",
      answer: "Desenvolvemos funcionalidades sob demanda. Nosso sistema é modular e pode ser expandido conforme suas necessidades crescem."
    },
    {
      question: "Vocês oferecem suporte?",
      answer: "Sim! Todos os planos incluem suporte. O plano Enterprise conta com suporte dedicado 24/7 e gerente de conta exclusivo."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">LojaIA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-slate-300 hover:text-white transition">Funcionalidades</a>
            <a href="#precos" className="text-slate-300 hover:text-white transition">Preços</a>
            <a href="#depoimentos" className="text-slate-300 hover:text-white transition">Depoimentos</a>
            <a href="#faq" className="text-slate-300 hover:text-white transition">FAQ</a>
          </nav>
          <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500">
            Agendar Demo
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 px-4 py-2">
            🚀 Sistema completo para lojas de informática
          </Badge>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Sua Loja de Informática com{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Inteligência Artificial
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto">
            E-commerce + Assistente IA + WhatsApp Bot + Monte seu PC. 
            Tudo integrado para você vender mais e atender melhor.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-lg px-8 py-6">
              Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 text-lg px-8 py-6">
              <Play className="mr-2 w-5 h-5" /> Ver Demonstração
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "500+", label: "Lojas ativas" },
              { value: "2M+", label: "Produtos vendidos" },
              { value: "98%", label: "Satisfação" },
              { value: "24/7", label: "Atendimento IA" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
              Funcionalidades
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Sistema completo desenvolvido especialmente para lojas de informática e tecnologia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-green-500/20 text-green-300 border-green-500/30">
                Benefícios
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que escolher o LojaIA?
              </h2>
              <p className="text-xl text-slate-400 mb-8">
                Desenvolvido por quem entende do mercado de informática, 
                com foco em aumentar suas vendas e reduzir custos operacionais.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <benefit.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-slate-300">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl">
                <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-16 h-16 text-violet-400 mx-auto mb-4" />
                    <p className="text-slate-400">Preview do Sistema</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">
              Preços
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              Sem taxa de setup. Cancele quando quiser.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-slate-800 rounded-full p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full transition ${
                  billingCycle === 'monthly' 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full transition flex items-center gap-2 ${
                  billingCycle === 'yearly' 
                    ? 'bg-violet-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Anual
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                  -20%
                </Badge>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <Card 
                key={i} 
                className={`relative bg-slate-800/50 border-slate-700 ${
                  plan.popular ? 'border-violet-500 scale-105 shadow-2xl shadow-violet-500/20' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-0 px-4 py-1">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-white">R$ {plan.price}</span>
                    <span className="text-slate-400">/mês</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-slate-300">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full mt-6 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
              Depoimentos
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-slate-400">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-slate-900/50">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Perguntas Frequentes
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem 
                key={i} 
                value={`item-${i}`}
                className="bg-slate-800/50 border border-slate-700 rounded-xl px-6"
              >
                <AccordionTrigger className="text-white hover:text-violet-400 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-12 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
            
            <div className="relative">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Pronto para transformar sua loja?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Junte-se a centenas de lojistas que já estão vendendo mais com o LojaIA
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-violet-600 hover:bg-slate-100 text-lg px-8 py-6">
                  Começar Teste Grátis <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6">
                  Agendar Demonstração
                </Button>
              </div>
              <p className="text-white/60 mt-6 text-sm">
                ✓ 14 dias grátis &nbsp; ✓ Sem cartão de crédito &nbsp; ✓ Cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">LojaIA</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 LojaIA. Todos os direitos reservados.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-400 hover:text-white transition">Termos</a>
              <a href="#" className="text-slate-400 hover:text-white transition">Privacidade</a>
              <a href="#" className="text-slate-400 hover:text-white transition">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingVendas;
