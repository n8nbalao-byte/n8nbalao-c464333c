import { useState, useEffect } from "react";
import { api, getCustomCategories } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Save, Image, Link as LinkIcon, ExternalLink, Loader2 } from "lucide-react";
import { removeBackground, loadImage, blobToBase64 } from "@/lib/removeBackground";

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
    description: "Banner principal no topo da página inicial (recomendado: 1920x200px)"
  },
  {
    key: "home_promo_1",
    label: "Banner Promocional 1",
    description: "Primeiro banner promocional (recomendado: 400x200px)"
  },
  {
    key: "home_promo_2",
    label: "Banner Promocional 2",
    description: "Segundo banner promocional (recomendado: 400x200px)"
  },
  {
    key: "home_promo_3",
    label: "Banner Promocional 3",
    description: "Terceiro banner promocional (recomendado: 400x200px)"
  },
  {
    key: "home_promo_4",
    label: "Banner Promocional 4",
    description: "Quarto banner promocional (recomendado: 400x200px)"
  },
  {
    key: "sidebar_promo_banners",
    label: "Banners Laterais (Sidebar)",
    description: "Banners promocionais na barra lateral - formato retrato (recomendado: 300x400px). Cada imagem pode ter um link.",
    aspectRatio: "3/4"
  },
  {
    key: "automacao_phone",
    label: "Celular Automação",
    description: "Imagem do celular na página de Automação (PNG com fundo transparente, recomendado: 400x800px)"
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
  const [removingBackground, setRemovingBackground] = useState(false);

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

  async function handleImageUpload(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    let uploadedCount = 0;
    const totalFiles = files.length;

    // Check if this is automacao_phone - needs background removal
    const needsBackgroundRemoval = key === 'automacao_phone';
    
    if (needsBackgroundRemoval) {
      setRemovingBackground(true);
      toast({ title: "Processando", description: "Removendo fundo da imagem com IA..." });
    }

    for (const file of Array.from(files)) {
      try {
        let finalImageUrl: string;
        
        if (needsBackgroundRemoval) {
          // Load image and remove background
          const img = await loadImage(file);
          const transparentBlob = await removeBackground(img);
          finalImageUrl = await blobToBase64(transparentBlob);
        } else {
          // Normal compression flow
          finalImageUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const img = new window.Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 1200;
                const scale = Math.min(1, maxWidth / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
              };
              img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
          });
        }
        
        setCarousels(prev => {
          const newCarousels = {
            ...prev,
            [key]: [...(prev[key] || []), { url: finalImageUrl, link: '' }]
          };
          
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            setTimeout(() => {
              autoSaveCarousel(key, newCarousels[key]);
            }, 100);
          }
          
          return newCarousels;
        });
      } catch (error) {
        console.error('Error processing image:', error);
        toast({ 
          title: "Erro", 
          description: needsBackgroundRemoval 
            ? "Falha ao remover fundo. Tente uma imagem PNG." 
            : "Falha ao processar imagem", 
          variant: "destructive" 
        });
      }
    }
    
    if (needsBackgroundRemoval) {
      setRemovingBackground(false);
      toast({ title: "Concluído", description: "Fundo removido com sucesso!" });
    }
    
    // Reset input
    e.target.value = '';
  }

  async function autoSaveCarousel(key: string, images: CarouselImage[]) {
    setSaving(key);
    const success = await api.saveCarousel(key, images);
    
    if (success) {
      toast({ title: "Salvo automaticamente", description: "Imagens salvas com sucesso!" });
    } else {
      toast({ title: "Erro", description: "Falha ao salvar automaticamente", variant: "destructive" });
    }
    setSaving(null);
  }

  async function handleRemoveImage(key: string, index: number) {
    const newImages = (carousels[key] || []).filter((_, i) => i !== index);
    setCarousels(prev => ({
      ...prev,
      [key]: newImages
    }));
    
    // Auto-save after removal
    await autoSaveCarousel(key, newImages);
  }

  function handleEditLink(key: string, index: number) {
    const currentLink = carousels[key]?.[index]?.link || '';
    setLinkValue(currentLink);
    setEditingLink({ key, index });
  }

  async function handleSaveLink() {
    if (!editingLink) return;
    
    const { key, index } = editingLink;
    const newImages = (carousels[key] || []).map((img, i) => 
      i === index ? { ...img, link: linkValue } : img
    );
    
    setCarousels(prev => ({
      ...prev,
      [key]: newImages
    }));
    
    setEditingLink(null);
    setLinkValue('');
    
    // Auto-save after link edit
    await autoSaveCarousel(key, newImages);
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
        Adicione imagens aos carrosséis. <span className="text-primary font-medium">Salvamento automático!</span> As imagens são salvas automaticamente após o upload.
      </p>

      {carouselConfigs.map(config => (
        <div key={config.key} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{config.label}</h3>
              <p className="text-sm text-gray-500">{config.description}</p>
            </div>
            {saving === config.key && (
              <span className="text-sm text-primary animate-pulse">Salvando...</span>
            )}
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
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 cursor-pointer transition-colors bg-gray-50 ${
                removingBackground && config.key === 'automacao_phone' ? 'opacity-50 pointer-events-none' : ''
              }`}
              style={{ aspectRatio: config.aspectRatio || '16/9' }}
            >
              {removingBackground && config.key === 'automacao_phone' ? (
                <>
                  <Loader2 className="h-8 w-8 text-primary mb-2 animate-spin" />
                  <span className="text-sm text-primary">Removendo fundo...</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    {config.key === 'automacao_phone' ? 'Adicionar (remove fundo)' : 'Adicionar'}
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple={config.key !== 'automacao_phone'}
                onChange={(e) => handleImageUpload(config.key, e)}
                className="hidden"
                disabled={removingBackground && config.key === 'automacao_phone'}
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
