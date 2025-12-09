import { useState, useEffect } from "react";
import { api, getCustomCategories } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Save, Image, Link as LinkIcon, ExternalLink } from "lucide-react";

interface CarouselConfig {
  key: string;
  label: string;
  description: string;
  aspectRatio?: string; // For display preview
}

interface CarouselImage {
  url: string;
  link?: string;
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
    key: "sidebar_promo_banners",
    label: "Banners Laterais (Sidebar)",
    description: "Banners promocionais na barra lateral - formato retrato (recomendado: 300x400px). Cada imagem pode ter um link.",
    aspectRatio: "3/4"
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

export function CarouselManager() {
  const { toast } = useToast();
  const [carousels, setCarousels] = useState<Record<string, CarouselImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [carouselConfigs, setCarouselConfigs] = useState<CarouselConfig[]>(BASE_CAROUSEL_CONFIGS);
  const [editingLink, setEditingLink] = useState<{ key: string; index: number } | null>(null);
  const [linkValue, setLinkValue] = useState("");

  useEffect(() => {
    fetchCarousels();
  }, []);

  async function fetchCarousels() {
    setLoading(true);
    
    // Fetch custom categories to create dynamic banner configs
    const customCategories = await getCustomCategories();
    
    // Create banner configs for existing categories
    const categoryBanners: CarouselConfig[] = customCategories.map(cat => ({
      key: `category_${cat.key}_banner`,
      label: `Banner Categoria: ${cat.label}`,
      description: `Banner acima dos produtos ${cat.label} (recomendado: 1200x200px)`
    }));
    
    // Combine base configs with category banners
    const allConfigs = [...BASE_CAROUSEL_CONFIGS, ...categoryBanners];
    setCarouselConfigs(allConfigs);
    
    const data: Record<string, CarouselImage[]> = {};
    
    for (const config of allConfigs) {
      const carousel = await api.getCarousel(config.key);
      // Handle both old format (string[]) and new format (CarouselImage[])
      const images = carousel.images || [];
      data[config.key] = images.map((img: string | CarouselImage) => 
        typeof img === 'string' ? { url: img, link: '' } : img
      );
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
            [key]: [...(prev[key] || []), { url: compressedImage, link: '' }]
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

  function handleEditLink(key: string, index: number) {
    const currentLink = carousels[key]?.[index]?.link || '';
    setLinkValue(currentLink);
    setEditingLink({ key, index });
  }

  function handleSaveLink() {
    if (!editingLink) return;
    
    const { key, index } = editingLink;
    setCarousels(prev => ({
      ...prev,
      [key]: (prev[key] || []).map((img, i) => 
        i === index ? { ...img, link: linkValue } : img
      )
    }));
    
    setEditingLink(null);
    setLinkValue('');
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
      {/* Link Edit Modal */}
      {editingLink && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Definir Link da Imagem</h3>
            <input
              type="text"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder="Ex: /loja?category=pc ou https://..."
              className="w-full px-4 py-3 border rounded-lg text-gray-800 mb-4"
            />
            <p className="text-sm text-gray-500 mb-4">
              Links internos: /loja, /monte-voce-mesmo, /produto/123<br />
              Links externos: https://exemplo.com
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setEditingLink(null); setLinkValue(''); }}
                className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLink}
                className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className={`grid ${config.aspectRatio === '3/4' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6'} gap-4`}>
            {(carousels[config.key] || []).map((image, index) => (
              <div 
                key={index} 
                className="relative group rounded-lg overflow-hidden border border-gray-200"
                style={{ aspectRatio: config.aspectRatio || '16/9' }}
              >
                <img
                  src={image.url}
                  alt={`${config.label} ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleEditLink(config.key, index)}
                    className="p-2 rounded-full bg-white text-gray-700 hover:bg-gray-100"
                    title="Definir link"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveImage(config.key, index)}
                    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Position indicator */}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/80 text-xs font-medium text-gray-700">
                  {index + 1}
                </div>
                
                {/* Link indicator */}
                {image.link && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-primary text-white text-xs flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Link
                  </div>
                )}
              </div>
            ))}

            {/* Add Image Button */}
            <label 
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 cursor-pointer transition-colors bg-gray-50"
              style={{ aspectRatio: config.aspectRatio || '16/9' }}
            >
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
