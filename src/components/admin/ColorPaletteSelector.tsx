import { Check, Palette } from 'lucide-react';

interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  preview: string[];
}

const colorPalettes: ColorPalette[] = [
  {
    id: 'vermelho-elegante',
    name: 'Vermelho Elegante',
    primary: '#E31C23',
    secondary: '#FFFFFF',
    accent: '#DC2626',
    preview: ['#E31C23', '#DC2626', '#FECACA', '#FEF2F2']
  },
  {
    id: 'azul-profissional',
    name: 'Azul Profissional',
    primary: '#2563EB',
    secondary: '#FFFFFF',
    accent: '#1D4ED8',
    preview: ['#2563EB', '#1D4ED8', '#BFDBFE', '#EFF6FF']
  },
  {
    id: 'verde-natureza',
    name: 'Verde Natureza',
    primary: '#16A34A',
    secondary: '#FFFFFF',
    accent: '#15803D',
    preview: ['#16A34A', '#15803D', '#BBF7D0', '#F0FDF4']
  },
  {
    id: 'roxo-moderno',
    name: 'Roxo Moderno',
    primary: '#9333EA',
    secondary: '#FFFFFF',
    accent: '#7C3AED',
    preview: ['#9333EA', '#7C3AED', '#DDD6FE', '#FAF5FF']
  },
  {
    id: 'laranja-vibrante',
    name: 'Laranja Vibrante',
    primary: '#EA580C',
    secondary: '#FFFFFF',
    accent: '#DC2626',
    preview: ['#EA580C', '#C2410C', '#FED7AA', '#FFF7ED']
  },
  {
    id: 'rosa-feminino',
    name: 'Rosa Feminino',
    primary: '#DB2777',
    secondary: '#FFFFFF',
    accent: '#BE185D',
    preview: ['#DB2777', '#BE185D', '#FBCFE8', '#FDF2F8']
  },
  {
    id: 'ciano-tech',
    name: 'Ciano Tech',
    primary: '#0891B2',
    secondary: '#FFFFFF',
    accent: '#0E7490',
    preview: ['#0891B2', '#0E7490', '#A5F3FC', '#ECFEFF']
  },
  {
    id: 'escuro-premium',
    name: 'Escuro Premium',
    primary: '#18181B',
    secondary: '#FAFAFA',
    accent: '#3F3F46',
    preview: ['#18181B', '#27272A', '#71717A', '#F4F4F5']
  },
  {
    id: 'dourado-luxo',
    name: 'Dourado Luxo',
    primary: '#CA8A04',
    secondary: '#FFFBEB',
    accent: '#A16207',
    preview: ['#CA8A04', '#A16207', '#FDE68A', '#FFFBEB']
  },
  {
    id: 'marinho-corporativo',
    name: 'Marinho Corporativo',
    primary: '#1E3A5F',
    secondary: '#FFFFFF',
    accent: '#0F172A',
    preview: ['#1E3A5F', '#0F172A', '#94A3B8', '#F1F5F9']
  },
];

interface ColorPaletteSelectorProps {
  currentPrimary: string;
  onSelectPalette: (palette: ColorPalette) => void;
}

export function ColorPaletteSelector({ currentPrimary, onSelectPalette }: ColorPaletteSelectorProps) {
  const isSelected = (palette: ColorPalette) => 
    palette.primary.toLowerCase() === currentPrimary?.toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Paletas de Cores (1 clique para aplicar)</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {colorPalettes.map((palette) => (
          <button
            key={palette.id}
            onClick={() => onSelectPalette(palette)}
            className={`relative group rounded-xl border-2 p-3 transition-all hover:scale-105 hover:shadow-lg ${
              isSelected(palette)
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {isSelected(palette) && (
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
            
            <div className="flex gap-0.5 mb-2 rounded-lg overflow-hidden">
              {palette.preview.map((color, idx) => (
                <div
                  key={idx}
                  className="h-8 flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            <p className="text-xs font-medium text-center text-foreground truncate">
              {palette.name}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export { colorPalettes };
export type { ColorPalette };
