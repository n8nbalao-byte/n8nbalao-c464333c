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

interface BenefitsCarouselProps {
  accentColor?: string;
}

export function BenefitsCarousel({ accentColor }: BenefitsCarouselProps) {
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const colorStyle = accentColor ? { color: accentColor } : {};
  const bgStyle = accentColor ? { backgroundColor: `${accentColor}20` } : {};
  const borderStyle = accentColor ? { borderColor: `${accentColor}50` } : {};

  return (
    <section id="benefits" className="py-20" style={accentColor ? { backgroundColor: "rgba(30, 30, 50, 0.3)" } : {}}>
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white lg:text-4xl">
            Por que escolher o <span style={colorStyle} className={!accentColor ? "text-primary" : ""}>WhatsAppBot IA</span>
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
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
                <div 
                  className="flip-card-front absolute w-full h-full backface-hidden rounded-xl border backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center"
                  style={accentColor ? { backgroundColor: "rgba(30, 30, 50, 0.8)", borderColor: "rgba(255,255,255,0.1)" } : {}}
                >
                  <div 
                    className={`mb-4 w-16 h-16 rounded-full flex items-center justify-center ${!accentColor ? "bg-primary/20" : ""}`}
                    style={bgStyle}
                  >
                    <i className={`${benefit.icon} text-2xl ${!accentColor ? "text-primary" : ""}`} style={colorStyle}></i>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{benefit.title}</h3>
                  <p className="text-sm text-gray-400">{benefit.front}</p>
                  <div className={`mt-4 text-xs ${!accentColor ? "text-primary/60" : ""}`} style={accentColor ? { color: `${accentColor}99` } : {}}>Clique para ver mais</div>
                </div>

                {/* Back */}
                <div 
                  className="flip-card-back absolute w-full h-full backface-hidden rounded-xl border backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center rotate-y-180"
                  style={accentColor ? { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}50` } : {}}
                >
                  <h3 className={`text-lg font-bold mb-4 ${!accentColor ? "text-primary" : ""}`} style={colorStyle}>{benefit.title}</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">{benefit.back}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div 
            className="p-6 rounded-xl backdrop-blur-sm border"
            style={accentColor ? { backgroundColor: "rgba(30, 30, 50, 0.5)", borderColor: "rgba(255,255,255,0.1)" } : {}}
          >
            <div className={`text-4xl font-bold ${!accentColor ? "text-primary" : ""}`} style={colorStyle}>+150%</div>
            <div className="text-sm text-gray-400 mt-2">Aumento em conversões</div>
          </div>
          <div 
            className="p-6 rounded-xl backdrop-blur-sm border"
            style={accentColor ? { backgroundColor: "rgba(30, 30, 50, 0.5)", borderColor: "rgba(255,255,255,0.1)" } : {}}
          >
            <div className={`text-4xl font-bold ${!accentColor ? "text-primary" : ""}`} style={colorStyle}>-50%</div>
            <div className="text-sm text-gray-400 mt-2">Redução em custos</div>
          </div>
          <div 
            className="p-6 rounded-xl backdrop-blur-sm border"
            style={accentColor ? { backgroundColor: "rgba(30, 30, 50, 0.5)", borderColor: "rgba(255,255,255,0.1)" } : {}}
          >
            <div className={`text-4xl font-bold ${!accentColor ? "text-primary" : ""}`} style={colorStyle}>+98%</div>
            <div className="text-sm text-gray-400 mt-2">Taxa de satisfação</div>
          </div>
          <div 
            className="p-6 rounded-xl backdrop-blur-sm border"
            style={accentColor ? { backgroundColor: "rgba(30, 30, 50, 0.5)", borderColor: "rgba(255,255,255,0.1)" } : {}}
          >
            <div className={`text-4xl font-bold ${!accentColor ? "text-primary" : ""}`} style={colorStyle}>24/7</div>
            <div className="text-sm text-gray-400 mt-2">Sempre online</div>
          </div>
        </div>
      </div>
    </section>
  );
}
