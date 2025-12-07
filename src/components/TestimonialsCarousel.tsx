import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "CEO da TechVentures",
    text: "Desde que implementamos o WhatsAppBot IA, nossas vendas cresceram 40%. O bot responde instantaneamente e os clientes adoram a experiência. É como se tivéssemos contratado 10 atendentes.",
    avatar: "CM"
  },
  {
    name: "Ana Paula Silva",
    role: "Gerente de Marketing",
    text: "Os clientes ficam impressionados quando descobrem que estavam falando com um bot. A capacidade de reconhecer áudios e responder com voz natural é incrível!",
    avatar: "AS"
  },
  {
    name: "Roberto Almeida",
    role: "Proprietário da Almeida Imóveis",
    text: "Nosso tempo de resposta diminuiu de horas para segundos. O bot consegue qualificar leads e agendar visitas automaticamente, o que aumentou nossa produtividade em mais de 200%.",
    avatar: "RA"
  },
  {
    name: "Juliana Costa",
    role: "Diretora de Operações",
    text: "A implementação foi surpreendentemente rápida e o suporte técnico é excelente. O bot aprendeu rapidamente sobre nossos serviços e agora responde perguntas complexas com precisão.",
    avatar: "JC"
  },
  {
    name: "Marcelo Santos",
    role: "Gerente de E-commerce",
    text: "O reconhecimento de comprovantes Pix revolucionou nosso processo de vendas. Agora confirmamos pagamentos automaticamente e liberamos os produtos sem intervenção humana.",
    avatar: "MS"
  },
  {
    name: "Fernanda Lima",
    role: "Proprietária de Clínica Estética",
    text: "Os clientes podem marcar, remarcar e cancelar consultas sem precisar falar com um atendente. Economizamos tempo e recursos significativamente.",
    avatar: "FL"
  },
];

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground lg:text-4xl">
            O que nossos clientes dizem
          </h2>
          <p className="mt-4 text-muted-foreground">
            Mais de 350 empresas já automatizaram seu atendimento com resultados impressionantes
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Navigation buttons */}
          <button
            onClick={goToPrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 p-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Testimonial card */}
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 lg:p-12">
                    <Quote className="h-10 w-10 text-primary/30 mb-6" />
                    
                    <p className="text-lg lg:text-xl text-foreground leading-relaxed mb-8">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setCurrentIndex(index);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-primary/30 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
