import { useState } from "react";

const benefits = [
  {
    icon: "fas fa-comments",
    title: "SEMPRE ONLINE 24/7",
    front: "Nunca mais perca um cliente. Seu bot responde a qualquer hora, todos os dias.",
    back: "Enquanto você dorme, seu negócio continua ativo, atendendo, vendendo e conquistando clientes — até de madrugada, finais de semana e feriados, sem custo adicional."
  },
  {
    icon: "fas fa-bolt",
    title: "PROSPECÇÃO DE LEADS",
    front: "Busca clientes no Google Maps e envia mensagens automáticas no WhatsApp.",
    back: "O bot encontra empresas pela palavra-chave escolhida, avalia, classifica, personaliza a mensagem e envia automaticamente sua apresentação para cada contato."
  },
  {
    icon: "fas fa-brain",
    title: "IA AVANÇADA",
    front: "Inteligência artificial treinada para interpretar perguntas complexas e entender contextos variados.",
    back: "Usamos as melhores IA do mercado: ChatGPT, Gemini, Claude, ElevenLabs, Grok, Copilot, DeepSeek."
  },
  {
    icon: "fas fa-microphone",
    title: "ÁUDIO HUMANIZADO",
    front: "Respostas em áudio natural com entonação humana. Clone sua própria voz!",
    back: "Com ElevenLabs, o bot pode usar a sua voz, criando um atendimento totalmente personalizado e único."
  },
  {
    icon: "fas fa-image",
    title: "ANALISA COMPROVANTE PIX",
    front: "Reconhece e interpreta automaticamente imagens e PDFs de comprovantes de pagamento.",
    back: "Atendimento muito mais rápido, preciso e inteligente. Valida pagamentos automaticamente!"
  },
  {
    icon: "fas fa-video",
    title: "ANALISA VÍDEOS",
    front: "Entende o conteúdo de vídeos enviados pelo cliente.",
    back: "O bot identifica objetos, transcreve falas, interpreta pedidos e mantém o fluxo do atendimento normalmente."
  },
  {
    icon: "fas fa-chart-line",
    title: "ENVIA NOTIFICAÇÃO",
    front: "Cria relatórios detalhados sobre a conversa e envia para o Gerente ou Supervisor.",
    back: "Após finalizar o atendimento, o bot gera um relatório completo e envia para o gerente, supervisor ou grupo da equipe."
  },
  {
    icon: "fas fa-phone-alt",
    title: "CHAMADA DE VOZ",
    front: "O cliente liga e conversa com seu agente usando voz natural.",
    back: "Inclusive a sua própria voz, clonada com ElevenLabs. Atendimento telefônico 100% automatizado!"
  },
];

export function BenefitsCarousel() {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="flip-card h-72 cursor-pointer perspective-1000"
              onClick={() => toggleCard(index)}
            >
              <div
                className={`flip-card-inner relative w-full h-full transition-transform duration-700 transform-style-3d ${
                  flippedCards[index] ? "rotate-y-180" : ""
                }`}
              >
                {/* Front */}
                <div className="flip-card-front absolute w-full h-full backface-hidden rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center">
                  <div className="mb-4 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <i className={`${benefit.icon} text-2xl text-primary`}></i>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.front}</p>
                  <div className="mt-4 text-xs text-primary/60">Clique para ver mais</div>
                </div>

                {/* Back */}
                <div className="flip-card-back absolute w-full h-full backface-hidden rounded-xl border border-primary/50 bg-primary/10 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center rotate-y-180">
                  <h3 className="text-lg font-bold text-primary mb-4">{benefit.title}</h3>
                  <p className="text-sm text-foreground leading-relaxed">{benefit.back}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
            <div className="text-4xl font-bold text-primary">+150%</div>
            <div className="text-sm text-muted-foreground mt-2">Aumento em conversões</div>
          </div>
          <div className="p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
            <div className="text-4xl font-bold text-primary">-50%</div>
            <div className="text-sm text-muted-foreground mt-2">Redução em custos</div>
          </div>
          <div className="p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
            <div className="text-4xl font-bold text-primary">+98%</div>
            <div className="text-sm text-muted-foreground mt-2">Taxa de satisfação</div>
          </div>
          <div className="p-6 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
            <div className="text-4xl font-bold text-primary">24/7</div>
            <div className="text-sm text-muted-foreground mt-2">Sempre online</div>
          </div>
        </div>
      </div>
    </section>
  );
}
