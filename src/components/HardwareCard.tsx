import type { HardwareItem, Product } from "@/lib/api";
import { Cpu, CircuitBoard, HardDrive, Zap, Box, MemoryStick, Monitor, ShoppingCart, Droplets } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface HardwareCardProps {
  hardware: HardwareItem;
  selected?: boolean;
  onSelect?: () => void;
  showSelect?: boolean;
  showBuyButton?: boolean;
}

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

export function HardwareCard({ hardware, selected, onSelect, showSelect = false, showBuyButton = false }: HardwareCardProps) {
  const Icon = categoryIcons[hardware.category] || Box;
  const { addToCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Convert hardware to a Product-like object for cart
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productFromHardware = {
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
    } as Product;
    addToCart(productFromHardware);
    toast.success(`${hardware.name} adicionado ao carrinho`);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border transition-all ${
        selected
          ? "border-primary bg-primary/10 shadow-glow"
          : "border-border bg-card hover:border-primary/50 hover:shadow-card"
      } ${showSelect ? "cursor-pointer" : ""}`}
      onClick={showSelect ? onSelect : undefined}
    >
      {/* Selection indicator */}
      {showSelect && (
        <div
          className={`absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
          }`}
        >
          {selected && <span className="text-xs">✓</span>}
        </div>
      )}

      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
          {hardware.image ? (
            <img
              src={hardware.image}
              alt={hardware.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          ) : (
            <Icon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">{categoryLabels[hardware.category]}</span>
          </div>
          <h3 className="truncate font-semibold text-foreground">{hardware.name}</h3>
          <p className="text-sm text-muted-foreground">
            {hardware.brand} {hardware.model}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <p className="font-bold text-primary">{formatPrice(hardware.price)}</p>
            {showBuyButton && (
              <button
                onClick={handleAddToCart}
                className="rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/80"
                title="Adicionar ao carrinho"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}