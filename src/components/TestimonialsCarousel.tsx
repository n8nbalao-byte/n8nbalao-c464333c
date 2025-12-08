import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Monique S.",
    role: "Cliente Google",
    text: "O Balão da Informática oferece um atendimento ágil e eficiente, com profissionais comprometidos e solícitos. A funcionária Bárbara se destaca pela simpatia, rapidez e atenção aos detalhes, tornando a experiência de compra agradável e confiável.",
    avatar: "MS",
    rating: 5
  },
  {
    name: "Dione Durazzo",
    role: "Cliente Google",
    text: "Atendimento simplesmente impecável na loja do Balão da Informática Campinas - Castelo. Equipe preparada, atenciosa e muito educada, com explicações claras!",
    avatar: "DD",
    rating: 5
  },
  {
    name: "Maria Santos",
    role: "Cliente Google",
    text: "Excelente atendimento, problema resolvido com qualidade pela atendente Julia. Não cobraram nada!! Nota 10",
    avatar: "MS",
    rating: 5
  },
  {
    name: "Ze Francisco",
    role: "Cliente Google",
    text: "Loja bacana, bem completa, me ajudou a imprimir um documento, pessoal muito solicito, me tirou dúvidas sobre PC games. Vou comprar de presente pros netos.",
    avatar: "ZF",
    rating: 5
  },
  {
    name: "Julia Santos",
    role: "Cliente Google",
    text: "Amei a Nova Loja da Informática Castelo! Espetacular! Gente, que experiência fantástica tive no Balão da Informática Castelo!",
    avatar: "JS",
    rating: 5
  },
  {
    name: "Marcia Regina",
    role: "Cliente Google",
    text: "Simplesmente incrível! Acionei o Balão da Informática pelo WhatsApp às 6:30 da manhã para comprar um carregador, e para minha surpresa, às 7:00 da manhã, ele já estava entregue na rodoviária! Nunca vi uma loja com tamanha agilidade!",
    avatar: "MR",
    rating: 5
  },
  {
    name: "Maria Cristina",
    role: "Cliente Google",
    text: "Quero registrar meu agradecimento à loja Balão da Informática. Fui muito bem atendida pelas atendentes Bárbara e Júlia — extremamente atenciosas, educadas e prestativas! Ainda recebi um ótimo desconto na minha compra.",
    avatar: "MC",
    rating: 5
  },
  {
    name: "Jennifer Ávila",
    role: "Cliente Google",
    text: "Empresa com atendimento excelente, sempre prestativos. Já efetivei mais de 6 compras de algumas licenças. Todas funcionando perfeitamente, entrega rápida. Precisei de suporte uma vez e fui prontamente atendida. Recomendo!",
    avatar: "JA",
    rating: 5
  },
  {
    name: "Matheus Barreto",
    role: "Cliente Google",
    text: "Fui atendido pelo Thiago Herrera e com certeza foi um dos melhores atendimentos que já tive pois fiz o pedido às 07:00 da manhã do sábado e em 15 minutos recebi o pedido na minha residência. Diferenciado demais!",
    avatar: "MB",
    rating: 5
  },
  {
    name: "Leticia Lopes",
    role: "Cliente Google",
    text: "Excelente loja, atendimento da Júlia impecável no WhatsApp, muito rápida, muito atenciosa! O Balão da Informática tem ótimos preços, promoções, o valor da mão de obra mais que justo, variedade de produtos.",
    avatar: "LL",
    rating: 5
  },
  {
    name: "Ronaldo Domingos",
    role: "Cliente Google",
    text: "Tive uma experiência muito positiva no Balão da Informática, onde o atendimento foi eficiente e atencioso. A funcionária Bárbara se mostrou extremamente gentil, prestativa e rápida, solucionando todas as demandas com profissionalismo.",
    avatar: "RD",
    rating: 5
  },
  {
    name: "Eliana Andrade",
    role: "Local Guide Google",
    text: "Minha experiência com a empresa Balão da Informática foi surpreendente, a Barbara tem um atendimento cordial, pontual e é muito profissional. Estou gostando muito do espaço, tenho aprendido muito com elas sobre as novas tecnologias!",
    avatar: "EA",
    rating: 5
  },
  {
    name: "Rafael Lopes",
    role: "Cliente Google",
    text: "A Bárbara foi incrível! Resolveu meu problema de impressão em menos de 10 minutos, com muita paciência, agilidade e atenção. Atendimento excelente — super recomendo! 👏",
    avatar: "RL",
    rating: 5
  },
  {
    name: "Paulo Féboli",
    role: "Cliente Google",
    text: "Atendimento rápido e eficiente. Precisei de uma fonte do meu notebook. Me atenderam prontamente e entregaram no hotel que eu estava sem custo! Recomendo! 👏",
    avatar: "PF",
    rating: 5
  },
];

interface TestimonialsCarouselProps {
  accentColor?: string;
}

export function TestimonialsCarousel({ accentColor }: TestimonialsCarouselProps) {
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

  const colorStyle = accentColor ? { color: accentColor } : {};
  const bgStyle = accentColor ? { backgroundColor: accentColor } : {};

  return (
    <section id="testimonials" className="py-20">
      <div className="container">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-2xl font-bold text-white">4.8</span>
            <span className="text-gray-400">• 713 avaliações no Google</span>
          </div>
          <h2 className="text-3xl font-bold text-white lg:text-4xl">
            O que nossos clientes dizem
          </h2>
          <p className="mt-4 text-gray-400">
            Avaliações reais de clientes verificados no Google
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Navigation buttons */}
          <button
            onClick={goToPrevious}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 p-2 rounded-full transition-colors ${!accentColor ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}`}
            style={accentColor ? { backgroundColor: `${accentColor}30`, color: accentColor } : {}}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={goToNext}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 p-2 rounded-full transition-colors ${!accentColor ? "bg-primary/20 text-primary hover:bg-primary/30" : ""}`}
            style={accentColor ? { backgroundColor: `${accentColor}30`, color: accentColor } : {}}
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
                  <div 
                    className="rounded-2xl border backdrop-blur-sm p-8 lg:p-12"
                    style={accentColor ? { backgroundColor: "rgba(30, 30, 50, 0.5)", borderColor: "rgba(255,255,255,0.1)" } : {}}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <Quote className={`h-10 w-10 ${!accentColor ? "text-primary/30" : ""}`} style={accentColor ? { color: `${accentColor}50` } : {}} />
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-lg lg:text-xl text-white leading-relaxed mb-8">
                      "{testimonial.text}"
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <div 
                        className={`flex h-14 w-14 items-center justify-center rounded-full text-white font-bold text-lg ${!accentColor ? "bg-primary" : ""}`}
                        style={bgStyle}
                      >
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-400">{testimonial.role}</div>
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
                  !accentColor 
                    ? (index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-primary/30 hover:bg-primary/50')
                    : ''
                }`}
                style={accentColor ? {
                  width: index === currentIndex ? '2rem' : '0.5rem',
                  backgroundColor: index === currentIndex ? accentColor : `${accentColor}50`
                } : {}}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
