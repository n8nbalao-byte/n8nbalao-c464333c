import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { api, type Product } from "@/lib/api";
import { ArrowLeft, Check, Shield, Headphones, Zap, MessageCircle } from "lucide-react";

export default function Produto() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      if (id) {
        const data = await api.getProduct(id);
        setProduct(data);
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
    { icon: Shield, label: "Pagamento Seguro" },
    { icon: Headphones, label: "Suporte 24/7" },
    { icon: Zap, label: "Ativação Imediata" },
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
            {/* Product Image */}
            <div className="relative">
              {product.categories && product.categories.length > 0 && (
                <span className="absolute right-4 top-4 z-10 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  {product.categories[0]}
                </span>
              )}
              <img
                src={product.image}
                alt={product.title}
                className="w-full max-w-lg mx-auto rounded-2xl shadow-card"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />

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
              <h1 className="text-4xl font-bold text-foreground">{product.title}</h1>
              
              {product.subtitle && (
                <p className="text-lg text-muted-foreground">{product.subtitle}</p>
              )}

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-primary">
                  {formatPrice(product.totalPrice)}
                </span>
                <span className="text-lg text-muted-foreground">/mês</span>
              </div>

              {/* Specs */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">O que está incluído:</h3>
                  <ul className="space-y-3">
                    {Object.entries(product.specs).map(([key, value]) => (
                      <li key={key} className="flex items-start gap-3">
                        <Check className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
                        <div>
                          <span className="font-medium text-foreground">{key}:</span>{" "}
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                <a
                  href={`https://wa.me/5519981470446?text=Olá! Tenho interesse no plano: ${product.title}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contratar Agora
                </a>
                <Link
                  to="/loja"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-8 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Ver Outros Planos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
