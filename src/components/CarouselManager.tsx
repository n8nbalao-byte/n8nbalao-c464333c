import { useState, useEffect } from "react";
import { api, getCustomCategories } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Save, Image } from "lucide-react";

interface CarouselConfig {
  key: string;
  label: string;
  description: string;
}

const BASE_CAROUSEL_CONFIGS: CarouselConfig[] = [
  {
    key: "home_hero_banner",
    label: "Banner Principal",
    description: "Banner principal no topo da página inicial (recomendado: 1920x480px)"
  },
  {
    key: "home_promo_left",
    label: "Banner Promoção Esquerda",
    description: "Banner promocional lado esquerdo (recomendado: 800x400px)"
  },
  {
    key: "home_promo_right",
    label: "Banner Promoção Direita",
    description: "Banner promocional lado direito (recomendado: 800x400px)"
  },
  {
    key: "nocode_section",
    label: "Seção No-Code (Automação)",
    description: "Imagens na página de Automação - seção 'Interface No-Code'"
  },
  {
    key: "workflow_section",
    label: "Seção Workflow (Automação)",
    description: "Imagens na página de Automação - seção 'Automatize processos'"
  }
];

// Default product categories for banners
const DEFAULT_CATEGORY_BANNERS: CarouselConfig[] = [
  { key: "category_pc_banner", label: "Banner Categoria: PCs Montados", description: "Banner acima dos produtos PCs (recomendado: 1200x200px)" },
  { key: "category_kit_banner", label: "Banner Categoria: Kits", description: "Banner acima dos produtos Kits (recomendado: 1200x200px)" },
  { key: "category_notebook_banner", label: "Banner Categoria: Notebooks", description: "Banner acima dos produtos Notebooks (recomendado: 1200x200px)" },
  { key: "category_hardware_banner", label: "Banner Categoria: Hardware", description: "Banner acima dos produtos Hardware (recomendado: 1200x200px)" },
  { key: "category_automacao_banner", label: "Banner Categoria: Automações", description: "Banner acima dos produtos Automações (recomendado: 1200x200px)" },
  { key: "category_software_banner", label: "Banner Categoria: Softwares", description: "Banner acima dos produtos Softwares (recomendado: 1200x200px)" },
  { key: "category_acessorio_banner", label: "Banner Categoria: Acessórios", description: "Banner acima dos produtos Acessórios (recomendado: 1200x200px)" },
  { key: "category_licenca_banner", label: "Banner Categoria: Licenças", description: "Banner acima dos produtos Licenças (recomendado: 1200x200px)" },
  { key: "category_monitor_banner", label: "Banner Categoria: Monitores", description: "Banner acima dos produtos Monitores (recomendado: 1200x200px)" },
  { key: "category_cadeira_gamer_banner", label: "Banner Categoria: Cadeiras Gamer", description: "Banner acima dos produtos Cadeiras Gamer (recomendado: 1200x200px)" },
];

export function CarouselManager() {
  const { toast } = useToast();
  const [carousels, setCarousels] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [carouselConfigs, setCarouselConfigs] = useState<CarouselConfig[]>([...BASE_CAROUSEL_CONFIGS, ...DEFAULT_CATEGORY_BANNERS]);

  useEffect(() => {
    fetchCarousels();
  }, []);

  async function fetchCarousels() {
    setLoading(true);
    
    // Fetch custom categories to create dynamic banner configs
    const customCategories = await getCustomCategories();
    const customCategoryBanners: CarouselConfig[] = customCategories.map(cat => ({
      key: `category_${cat.key}_banner`,
      label: `Banner Categoria: ${cat.label}`,
      description: `Banner acima dos produtos ${cat.label} (recomendado: 1200x200px)`
    }));
    
    // Merge all configs, avoiding duplicates
    const allConfigs = [...BASE_CAROUSEL_CONFIGS, ...DEFAULT_CATEGORY_BANNERS];
    customCategoryBanners.forEach(config => {
      if (!allConfigs.find(c => c.key === config.key)) {
        allConfigs.push(config);
      }
    });
    setCarouselConfigs(allConfigs);
    
    const data: Record<string, string[]> = {};
    
    for (const config of allConfigs) {
      const carousel = await api.getCarousel(config.key);
      data[config.key] = carousel.images || [];
    }
    
    setCarousels(data);
    setLoading(false);
  }

  async function handleSave(key: string) {
    setSaving(key);
    const success = await api.saveCarousel(key, carousels[key] || []);
    
    if (success) {
      toast({ title: "Sucesso", description: "Carrossel salvo com sucesso!" });
    } else {
      toast({ title: "Erro", description: "Falha ao salvar carrossel", variant: "destructive" });
    }
    setSaving(null);
  }

  function handleImageUpload(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
          
          setCarousels(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), compressedImage]
          }));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
  }

  function handleRemoveImage(key: string, index: number) {
    setCarousels(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index)
    }));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {carouselConfigs.map(config => (
          <div key={config.key} className="h-48 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Image className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Carrosséis da Home</h2>
      </div>
      
      <p className="text-gray-600">
        Adicione imagens aos carrosséis que aparecem na página inicial. As imagens serão exibidas alternando automaticamente.
      </p>

      {carouselConfigs.map(config => (
        <div key={config.key} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{config.label}</h3>
              <p className="text-sm text-gray-500">{config.description}</p>
            </div>
            <button
              onClick={() => handleSave(config.key)}
              disabled={saving === config.key}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving === config.key ? "Salvando..." : "Salvar"}
            </button>
          </div>

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(carousels[config.key] || []).map((image, index) => (
              <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={image}
                  alt={`${config.label} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(config.key, index)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/80 text-xs font-medium text-gray-700">
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Add Image Button */}
            <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 cursor-pointer transition-colors bg-gray-50">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Adicionar</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageUpload(config.key, e)}
                className="hidden"
              />
            </label>
          </div>

          {(carousels[config.key] || []).length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Nenhuma imagem adicionada. Adicione imagens para criar o carrossel.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
