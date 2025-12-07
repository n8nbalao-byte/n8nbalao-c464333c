import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { MediaCarousel } from "@/components/MediaCarousel";
import { api, type Product, type HardwareItem } from "@/lib/api";
import { ArrowLeft, Shield, Headphones, Zap, MessageCircle, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Box, Download, Droplets } from "lucide-react";

const componentLabels: Record<string, string> = {
  processor: "Processador",
  motherboard: "Placa-Mãe",
  memory: "Memória RAM",
  storage: "Armazenamento",
  gpu: "Placa de Vídeo",
  psu: "Fonte",
  case: "Gabinete",
  cooler: "Cooler",
};

const componentIcons: Record<string, React.ElementType> = {
  processor: Cpu,
  motherboard: CircuitBoard,
  memory: MemoryStick,
  storage: HardDrive,
  gpu: Monitor,
  psu: Zap,
  case: Box,
  cooler: Droplets,
};

const componentCategories = ['processor', 'motherboard', 'memory', 'storage', 'gpu', 'psu', 'case', 'cooler'];

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [hardwareDetails, setHardwareDetails] = useState<Record<string, HardwareItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (id) {
        const data = await api.getProduct(id);
        setProduct(data);
        
        // If we have component IDs (strings), fetch the full hardware details
        if (data?.components && data.productType === 'pc') {
          const allHardware = await Promise.all(
            componentCategories.map(cat => api.getHardware(cat))
          );
          
          // Create a map of all hardware by ID
          const hardwareMap: Record<string, HardwareItem> = {};
          allHardware.flat().forEach(hw => {
            hardwareMap[hw.id] = hw;
          });
          
          // Map component IDs to full hardware objects
          const details: Record<string, HardwareItem> = {};
          for (const [key, value] of Object.entries(data.components)) {
            // value could be a string (ID) or an object (legacy full hardware)
            if (typeof value === 'string' && hardwareMap[value]) {
              details[key] = hardwareMap[value];
            } else if (typeof value === 'object' && value !== null && 'id' in value) {
              // Legacy: full hardware object was saved
              details[key] = value as HardwareItem;
            }
          }
          setHardwareDetails(details);
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
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

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Produto não encontrado</h1>
          <Link to="/loja" className="mt-4 inline-flex items-center gap-2 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  const hasComponents = Object.keys(hardwareDetails).length > 0;
  const isAutomacao = product.productType === 'automacao';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="py-12">
        <div className="container">
          {/* Breadcrumb */}
          <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">Início</Link>
            <span>/</span>
            <Link to="/loja" className="text-primary hover:underline">Loja</Link>
            <span>/</span>
            <span>{product.title}</span>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Product Media */}
            <div>
              <MediaCarousel media={product.media || []} />

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
              {product.categories && product.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((cat) => (
                    <span key={cat} className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-primary">
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-4xl font-bold text-foreground">{product.title}</h1>
              
              {product.subtitle && (
                <p className="text-lg text-muted-foreground">{product.subtitle}</p>
              )}

              {!isAutomacao && (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">
                    {formatPrice(product.totalPrice)}
                  </span>
                  <span className="text-lg text-muted-foreground">à vista</span>
                </div>
              )}

              {/* Components as simple text (for PC products) */}
              {hasComponents && (
                <div className="space-y-2 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuração</h3>
                  <ul className="space-y-1">
                    {Object.entries(hardwareDetails).map(([key, hw]) => {
                      if (!hw) return null;
                      const Icon = componentIcons[key] || Cpu;
                      return (
                        <li key={key} className="flex items-center gap-2 text-foreground">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-medium">{componentLabels[key]}:</span>
                          <span className="text-muted-foreground">{hw.brand} {hw.model}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                {isAutomacao && product.downloadUrl ? (
                  <a
                    href={product.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                  >
                    <Download className="h-5 w-5" />
                    Baixar Agora
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/5519981470446?text=Olá! Tenho interesse no produto: ${product.title}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Comprar Agora
                  </a>
                )}
                <Link
                  to="/loja"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-8 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Ver Outros Produtos
                </Link>
              </div>
            </div>
          </div>

          {/* Extra Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <section className="mt-16">
              <h2 className="mb-8 text-3xl font-bold text-foreground">Especificações</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    {Object.entries(product.specs).map(([key, value]) => (
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
