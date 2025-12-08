import { Link } from "react-router-dom";
import type { HardwareItem, Product } from "@/lib/api";
import { Cpu, CircuitBoard, HardDrive, Zap, Box, MemoryStick, Monitor, ShoppingCart, Droplets } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useViewMode } from "@/contexts/ViewModeContext";
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
  const { viewMode } = useViewMode();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

  const isClickableLink = !showSelect && showBuyButton;

  // List view
  if (viewMode === 'list' && !showSelect) {
    const content = (
      <div className="flex gap-4 p-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
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
            <Icon className="h-8 w-8 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4" style={{ color: '#DC2626' }} />
              <span className="text-xs text-gray-500">{categoryLabels[hardware.category]}</span>
            </div>
            <h3 className="font-semibold text-gray-800">{hardware.name}</h3>
            <p className="text-sm text-gray-500">{hardware.brand} {hardware.model}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-lg font-bold" style={{ color: '#DC2626' }}>{formatPrice(hardware.price)}</p>
            {showBuyButton && (
              <button
                onClick={handleAddToCart}
                className="rounded-lg px-4 py-2 text-white transition-colors hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: '#DC2626' }}
              >
                <ShoppingCart className="h-4 w-4" />
                Adicionar
              </button>
            )}
          </div>
        </div>
      </div>
    );

    if (isClickableLink) {
      return (
        <Link
          to={`/hardware/${hardware.id}`}
          className="group block overflow-hidden rounded-xl border-2 transition-all bg-white hover:shadow-lg"
          style={{ borderColor: '#E5E7EB' }}
        >
          {content}
        </Link>
      );
    }
    return (
      <div className="overflow-hidden rounded-xl border-2 bg-white" style={{ borderColor: '#E5E7EB' }}>
        {content}
      </div>
    );
  }

  // Compact view
  if (viewMode === 'compact' && !showSelect) {
    const content = (
      <div className="p-2">
        <div className="flex h-16 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 mb-2">
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
            <Icon className="h-6 w-6 text-gray-400" />
          )}
        </div>
        <h3 className="text-xs font-medium text-gray-800 line-clamp-2">{hardware.name}</h3>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm font-bold" style={{ color: '#DC2626' }}>{formatPrice(hardware.price)}</p>
          {showBuyButton && (
            <button
              onClick={handleAddToCart}
              className="rounded p-1 text-white"
              style={{ backgroundColor: '#DC2626' }}
            >
              <ShoppingCart className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    );

    if (isClickableLink) {
      return (
        <Link
          to={`/hardware/${hardware.id}`}
          className="group block overflow-hidden rounded-lg border transition-all bg-white hover:shadow-md"
          style={{ borderColor: '#E5E7EB' }}
        >
          {content}
        </Link>
      );
    }
    return (
      <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: '#E5E7EB' }}>
        {content}
      </div>
    );
  }

  // Standard view (default)
  const cardContent = (
    <>
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
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
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
            <Icon className="h-8 w-8 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: '#DC2626' }} />
            <span className="text-xs text-gray-500">{categoryLabels[hardware.category]}</span>
          </div>
          <h3 className="truncate font-semibold text-gray-800">{hardware.name}</h3>
          <p className="text-sm text-gray-500">
            {hardware.brand} {hardware.model}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <p className="font-bold" style={{ color: '#DC2626' }}>{formatPrice(hardware.price)}</p>
            {showBuyButton && (
              <button
                onClick={handleAddToCart}
                className="rounded-lg p-2 text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: '#DC2626' }}
                title="Adicionar ao carrinho"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );

  if (isClickableLink) {
    return (
      <Link
        to={`/hardware/${hardware.id}`}
        className="group relative block overflow-hidden rounded-xl border-2 transition-all bg-white hover:shadow-lg"
        style={{ borderColor: '#E5E7EB' }}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-2 transition-all bg-white ${showSelect ? "cursor-pointer" : ""}`}
      style={{ 
        borderColor: selected ? '#DC2626' : '#E5E7EB',
        backgroundColor: selected ? '#FEF2F2' : 'white'
      }}
      onClick={showSelect ? onSelect : undefined}
    >
      {cardContent}
    </div>
  );
}
