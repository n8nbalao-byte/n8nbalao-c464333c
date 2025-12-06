import type { HardwareItem } from "@/lib/api";
import { Cpu, CircuitBoard, HardDrive, Zap, Box, MemoryStick, Monitor } from "lucide-react";

interface HardwareCardProps {
  hardware: HardwareItem;
  selected?: boolean;
  onSelect?: () => void;
  showSelect?: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  processor: Cpu,
  motherboard: CircuitBoard,
  memory: MemoryStick,
  storage: HardDrive,
  gpu: Monitor,
  psu: Zap,
  case: Box,
};

const categoryLabels: Record<string, string> = {
  processor: "Processador",
  motherboard: "Placa-Mãe",
  memory: "Memória RAM",
  storage: "Armazenamento",
  gpu: "Placa de Vídeo",
  psu: "Fonte",
  case: "Gabinete",
};

export function HardwareCard({ hardware, selected, onSelect, showSelect = false }: HardwareCardProps) {
  const Icon = categoryIcons[hardware.category] || Box;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
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
          <p className="mt-1 font-bold text-primary">{formatPrice(hardware.price)}</p>
        </div>
      </div>
    </div>
  );
}