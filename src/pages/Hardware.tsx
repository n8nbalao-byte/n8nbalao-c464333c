import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api, type HardwareItem } from "@/lib/api";
import { ArrowLeft, Shield, Headphones, Zap, MessageCircle, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Box, Droplets, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/api";

const categoryLabels: Record<string, string> = {
  processor: "Processador",
  motherboard: "Placa-Mãe",
  memory: "Memória RAM",
  storage: "Armazenamento",
  gpu: "Placa de Vídeo",
  psu: "Fonte",
  case: "Gabinete",
  cooler: "Cooler",
};

const categoryIcons: Record<string, React.ElementType> = {
  processor: Cpu,
  motherboard: CircuitBoard,
  memory: MemoryStick,
  storage: HardDrive,
  gpu: Monitor,
  psu: Zap,
  case: Box,
  cooler: Droplets,
};

export default function Hardware() {
  const { id } = useParams<{ id: string }>();
  const [hardware, setHardware] = useState<HardwareItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchHardware() {
      if (id) {
        // Fetch all hardware and find by ID
        const allHardware = await api.getHardware();
        const found = allHardware.find(h => h.id === id);
        setHardware(found || null);
      }
      setLoading(false);
    }
    fetchHardware();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!hardware) return;
    
    const productFromHardware: Product = {
      id: hardware.id,
      title: hardware.name,
      subtitle: `${hardware.brand} ${hardware.model}`,
      categories: [hardware.category],
      media: hardware.image ? [{ type: 'image' as const, url: hardware.image }] : [],
      specs: hardware.specs || {},
      components: {},
      totalPrice: hardware.price,
      productType: 'hardware' as any,
      createdAt: '',
    };
    addToCart(productFromHardware);
  };

  const trustBadges = [
    { icon: Shield, label: "Garantia Incluída" },
    { icon: Headphones, label: "Suporte Técnico" },
    { icon: Zap, label: "Pronta Entrega" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20">
          <div className="h-96 animate-pulse rounded-xl bg-card" />
        </div>
      </div>
    );
  }

  if (!hardware) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Hardware não encontrado</h1>
          <Link to="/loja" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const Icon = categoryIcons[hardware.category] || Box;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-12">
        <div className="container">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">Início</Link>
            <span>/</span>
            <Link to="/loja" className="text-primary hover:underline">Loja</Link>
            <span>/</span>
            <span className="text-primary hover:underline">Hardware</span>
            <span>/</span>
            <span>{hardware.name}</span>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Product Image */}
            <div>
              <div className="aspect-square overflow-hidden rounded-xl border border-border bg-card">
                {hardware.image ? (
                  <img
                    src={hardware.image}
                    alt={hardware.name}
                    className="h-full w-full object-contain p-8"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Icon className="h-32 w-32 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex justify-around">
                {trustBadges.map((badge) => (
                  <div key={badge.label} className="flex flex-col items-center gap-2 text-center">
                    <badge.icon className="h-8 w-8 text-primary" />
                    <span className="text-sm text-muted-foreground">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                  {categoryLabels[hardware.category] || hardware.category}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-foreground">{hardware.name}</h1>
              
              <p className="text-lg text-muted-foreground">
                {hardware.brand} {hardware.model}
              </p>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(hardware.price)}
                </span>
                <span className="text-lg text-muted-foreground">à vista</span>
              </div>

              {/* Technical Specs */}
              {hardware.socket && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Socket:</span>
                  <span className="font-medium text-foreground">{hardware.socket}</span>
                </div>
              )}
              
              {hardware.memoryType && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Tipo de Memória:</span>
                  <span className="font-medium text-foreground">{hardware.memoryType}</span>
                </div>
              )}
              
              {hardware.formFactor && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Form Factor:</span>
                  <span className="font-medium text-foreground">{hardware.formFactor}</span>
                </div>
              )}
              
              {hardware.tdp && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">TDP:</span>
                  <span className="font-medium text-foreground">{hardware.tdp}W</span>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  size="lg"
                  className="w-full gap-2 px-8 py-6 text-lg shadow-glow"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Adicionar ao Carrinho
                </Button>
                
                <a
                  href={`https://wa.me/5519981470446?text=Olá! Tenho interesse no hardware: ${hardware.name} - ${hardware.brand} ${hardware.model}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-700"
                >
                  <MessageCircle className="h-5 w-5" />
                  Falar no WhatsApp
                </a>
                
                <Link
                  to="/loja"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-8 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar para a Loja
                </Link>
              </div>
            </div>
          </div>

          {/* Extra Specs */}
          {hardware.specs && Object.keys(hardware.specs).length > 0 && (
            <section className="mt-16">
              <h2 className="mb-8 text-3xl font-bold text-foreground">Especificações</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    {Object.entries(hardware.specs).map(([key, value]) => (
                      <tr key={key} className="hover:bg-secondary/50">
                        <td className="px-6 py-4 font-medium text-foreground">{key}</td>
                        <td className="px-6 py-4 text-muted-foreground">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}