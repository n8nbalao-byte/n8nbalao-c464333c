import { useState } from "react";
import { Clock, Zap, Brain, Mic, Image, Shield, BarChart3, Plug } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Atendimento 24/7",
    short: "Nunca mais perca um cliente. Seu bot responde a qualquer hora, em qualquer dia.",
    detail: "Com nosso bot, você nunca fecha! Atenda clientes de madrugada, finais de semana e feriados sem custo adicional. Enquanto você dorme, seu negócio continua vendendo."
  },
  {
    icon: Zap,
    title: "Resposta Imediata",
    short: "Atendimento instantâneo sem filas de espera, mesmo com alto volume.",
    detail: "Resposta em menos de 2 segundos! Seus clientes não esperam e você não perde vendas. Atenda milhares de pessoas simultaneamente."
  },
  {
    icon: Brain,
    title: "IA Avançada",
    short: "Inteligência artificial treinada para entender perguntas complexas.",
    detail: "IA que entende contexto e lembra conversas. Atendimento humano, mas automatizado! Processamento de linguagem natural avançado."
  },
  {
    icon: Mic,
    title: "Áudio Humanizado",
    short: "Respostas em áudio com voz natural e entonação humana.",
    detail: "Respostas em áudio natural. Perfeito para clientes que preferem ouvir! Vozes profissionais e naturais."
  },
  {
    icon: Image,
    title: "Análise de Imagens",
    short: "Reconhece e interpreta imagens enviadas pelos clientes.",
    detail: "Analisa fotos e comprovantes automaticamente. Atendimento mais rápido e eficiente! Reconhecimento de Pix integrado."
  },
  {
    icon: Shield,
    title: "Seguro e Confiável",
    short: "Criptografia de ponta a ponta e proteção total dos dados.",
    detail: "Criptografia bancária e 100% LGPD. Seus dados totalmente protegidos! Segurança de nível enterprise."
  },
  {
    icon: BarChart3,
    title: "Análise de Desempenho",
    short: "Relatórios detalhados sobre conversas e taxa de conversão.",
    detail: "Acompanhe métricas em tempo real. Dados que ajudam você a vender mais! Dashboard completo."
  },
  {
    icon: Plug,
    title: "Integração Completa",
    short: "Conecte com suas ferramentas de gestão e CRM.",
    detail: "Integre com CRM, e-commerce e muito mais. Tudo sincronizado automaticamente! Mais de 500 integrações."
  },
];

export function BenefitsCarousel() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="benefits" className="py-20 bg-card/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
            Por que escolher o <span className="text-primary">WhatsAppBot IA</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Nossa solução oferece recursos exclusivos que transformam seu atendimento e aumentam suas conversões.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`
                relative rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm p-6 
                transition-all duration-500 cursor-pointer overflow-hidden
                ${activeIndex === index ? 'border-primary/50 shadow-glow scale-105 z-10' : 'hover:border-primary/30'}
              `}
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/20 p-3">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              
              <h3 className="mb-2 text-lg font-semibold text-foreground">{benefit.title}</h3>
              
              <p className={`text-sm transition-all duration-300 ${
                activeIndex === index ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {activeIndex === index ? benefit.detail : benefit.short}
              </p>

              {/* Glow effect on hover */}
              {activeIndex === index && (
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary">40%</div>
            <div className="text-sm text-muted-foreground mt-1">Aumento em conversões</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary">60%</div>
            <div className="text-sm text-muted-foreground mt-1">Redução em custos</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary">98%</div>
            <div className="text-sm text-muted-foreground mt-1">Taxa de satisfação</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground mt-1">Disponibilidade</div>
          </div>
        </div>
      </div>
    </section>
  );
}
