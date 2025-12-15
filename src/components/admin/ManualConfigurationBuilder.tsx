import { useState, useEffect } from "react";
import { Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box, Droplets, X, Save, ChevronRight, ChevronLeft, Armchair, Mouse, Keyboard, Tv, Search } from "lucide-react";
import { api, type HardwareItem, type Product, getCategories, type Category } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ConfigurationType } from "./ConfigurationTypeSelector";

interface ManualConfigurationBuilderProps {
  configurationType: ConfigurationType;
  hardware: Record<string, HardwareItem[]>;
  allProducts: Product[];
  onSave: (product: Partial<Product>) => Promise<void>;
  onClose: () => void;
}

// Component steps for different configurations
const componentSteps = {
  kit: [
    { key: 'processor', label: 'Processador', icon: Cpu },
    { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
    { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  ],
  pc: [
    { key: 'processor', label: 'Processador', icon: Cpu },
    { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
    { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
    { key: 'storage', label: 'Armazenamento', icon: HardDrive },
    { key: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
    { key: 'cooler', label: 'Cooler', icon: Droplets },
    { key: 'psu', label: 'Fonte', icon: Zap },
    { key: 'case', label: 'Gabinete', icon: Box },
  ],
  setup_completo: [
    { key: 'processor', label: 'Processador', icon: Cpu },
    { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
    { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
    { key: 'storage', label: 'Armazenamento', icon: HardDrive },
    { key: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
    { key: 'cooler', label: 'Cooler', icon: Droplets },
    { key: 'psu', label: 'Fonte', icon: Zap },
    { key: 'case', label: 'Gabinete', icon: Box },
  ],
};

// Extra categories for setup completo
const setupExtraCategories = [
  { key: 'cadeira_gamer', label: 'Cadeira Gamer', icon: Armchair },
  { key: 'monitor', label: 'Monitor', icon: Tv },
  { key: 'mouse', label: 'Mouse', icon: Mouse },
  { key: 'teclado', label: 'Teclado', icon: Keyboard },
];

export function ManualConfigurationBuilder({ 
  configurationType, 
  hardware, 
  allProducts,
  onSave, 
  onClose 
}: ManualConfigurationBuilderProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedComponents, setSelectedComponents] = useState<Record<string, HardwareItem>>({});
  const [selectedExtras, setSelectedExtras] = useState<Record<string, Product>>({});
  const [title, setTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExtraPhase, setIsExtraPhase] = useState(false);
  const [activeExtraCategory, setActiveExtraCategory] = useState(setupExtraCategories[0].key);

  const steps = componentSteps[configurationType];
  const currentStepData = steps[currentStep];

  // Get compatible items based on selected components
  const getCompatibleItems = (componentKey: string): HardwareItem[] => {
    const allItems = hardware[componentKey] || [];
    
    // Filter by socket compatibility
    if (componentKey === 'motherboard' && selectedComponents.processor) {
      const processorSocket = selectedComponents.processor.socket;
      if (processorSocket) {
        return allItems.filter(item => item.socket === processorSocket);
      }
    }
    
    // Filter by memory type
    if (componentKey === 'memory' && selectedComponents.motherboard) {
      const motherboardMemoryType = selectedComponents.motherboard.memoryType;
      if (motherboardMemoryType) {
        return allItems.filter(item => item.memoryType === motherboardMemoryType);
      }
    }

    // Filter by socket for cooler
    if (componentKey === 'cooler' && selectedComponents.processor) {
      const processorSocket = selectedComponents.processor.socket;
      if (processorSocket) {
        return allItems.filter(item => 
          item.socket === processorSocket || item.socket === 'Universal' || !item.socket
        );
      }
    }

    // Filter by form factor for case
    if (componentKey === 'case' && selectedComponents.motherboard) {
      const motherboardFormFactor = selectedComponents.motherboard.formFactor;
      if (motherboardFormFactor) {
        return allItems.filter(item => item.formFactor === motherboardFormFactor || !item.formFactor);
      }
    }

    return allItems;
  };

  const handleSelectComponent = (item: HardwareItem) => {
    setSelectedComponents(prev => ({
      ...prev,
      [currentStepData.key]: item,
    }));
    
    // Auto-advance to next step
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSearchTerm('');
    } else if (configurationType === 'setup_completo') {
      setIsExtraPhase(true);
      setSearchTerm('');
    }
  };

  const handleSelectExtra = (product: Product, category: string) => {
    setSelectedExtras(prev => ({
      ...prev,
      [category]: product,
    }));
  };

  const handleRemoveExtra = (category: string) => {
    setSelectedExtras(prev => {
      const newExtras = { ...prev };
      delete newExtras[category];
      return newExtras;
    });
  };

  const calculateTotalPrice = () => {
    const hardwareTotal = Object.values(selectedComponents).reduce((sum, item) => sum + item.price, 0);
    const extrasTotal = Object.values(selectedExtras).reduce((sum, product) => sum + (product.totalPrice || 0), 0);
    return hardwareTotal + extrasTotal;
  };

  const generateTitle = () => {
    const processor = selectedComponents.processor;
    const gpu = selectedComponents.gpu;
    const motherboard = selectedComponents.motherboard;
    
    if (configurationType === 'kit') {
      return `Kit ${processor?.brand || ''} ${processor?.model || ''} + ${motherboard?.brand || ''} + RAM`;
    } else {
      return `PC ${processor?.brand || ''} ${processor?.model || ''}${gpu ? ` + ${gpu.brand} ${gpu.model}` : ''}`;
    }
  };

  useEffect(() => {
    if (Object.keys(selectedComponents).length > 0 && !title) {
      setTitle(generateTitle());
    }
  }, [selectedComponents]);

  const handleSave = async () => {
    const productType = configurationType === 'kit' ? 'kit' : 'pc';
    
    // Build description with extra products info if any
    let description = '';
    if (Object.keys(selectedExtras).length > 0) {
      const extrasText = Object.entries(selectedExtras)
        .map(([cat, prod]) => `${cat}: ${prod.title} (R$ ${(prod.totalPrice || 0).toFixed(2)})`)
        .join(', ');
      description = `Inclui: ${extrasText}`;
    }

    await onSave({
      title: title || generateTitle(),
      subtitle: `${configurationType === 'kit' ? 'Kit' : configurationType === 'pc' ? 'PC Montado' : 'Setup Completo'} - ${Object.keys(selectedComponents).length} componentes`,
      description,
      categories: [],
      media: [],
      specs: {},
      components: selectedComponents,
      totalPrice: calculateTotalPrice(),
      productType,
    });
  };

  const filteredItems = isExtraPhase
    ? allProducts.filter(p => 
        (p.productType === activeExtraCategory || p.categories?.includes(activeExtraCategory)) &&
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : getCompatibleItems(currentStepData?.key || '').filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );

  const isComplete = configurationType === 'setup_completo' 
    ? Object.keys(selectedComponents).length === steps.length
    : Object.keys(selectedComponents).length === steps.length;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50">
      <div className="w-full h-full flex flex-col bg-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {configurationType === 'kit' ? 'Montar Kit' : configurationType === 'pc' ? 'Montar PC' : 'Montar Setup Completo'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isExtraPhase ? 'Adicione periféricos e acessórios (opcional)' : `Passo ${currentStep + 1} de ${steps.length}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-sm text-muted-foreground">Total</span>
              <p className="text-2xl font-bold text-primary">R$ {calculateTotalPrice().toFixed(2)}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Steps */}
          <div className="w-64 border-r border-border p-4 overflow-y-auto bg-secondary/30">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">COMPONENTES</h3>
            <div className="space-y-1">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isSelected = !!selectedComponents[step.key];
                const isCurrent = !isExtraPhase && currentStep === index;
                
                return (
                  <button
                    key={step.key}
                    onClick={() => {
                      setIsExtraPhase(false);
                      setCurrentStep(index);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      isCurrent 
                        ? 'bg-primary text-primary-foreground' 
                        : isSelected 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'hover:bg-secondary'
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{step.label}</p>
                      {isSelected && (
                        <p className="text-xs truncate opacity-75">
                          {selectedComponents[step.key].brand} {selectedComponents[step.key].model}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {configurationType === 'setup_completo' && (
              <>
                <h3 className="text-sm font-semibold text-muted-foreground mt-6 mb-3">PERIFÉRICOS</h3>
                <div className="space-y-1">
                  {setupExtraCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = !!selectedExtras[cat.key];
                    const isCurrent = isExtraPhase && activeExtraCategory === cat.key;
                    
                    return (
                      <button
                        key={cat.key}
                        onClick={() => {
                          setIsExtraPhase(true);
                          setActiveExtraCategory(cat.key);
                          setSearchTerm('');
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                          isCurrent 
                            ? 'bg-primary text-primary-foreground' 
                            : isSelected 
                              ? 'bg-green-500/10 text-green-600' 
                              : 'hover:bg-secondary'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{cat.label}</p>
                          {isSelected && (
                            <p className="text-xs truncate opacity-75">
                              {selectedExtras[cat.key].title}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isExtraPhase ? "Buscar produtos..." : "Buscar componentes..."}
                  className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {isExtraPhase ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map((product) => {
                    const isSelected = selectedExtras[activeExtraCategory]?.id === product.id;
                    return (
                      <button
                        key={product.id}
                        onClick={() => isSelected 
                          ? handleRemoveExtra(activeExtraCategory) 
                          : handleSelectExtra(product as Product, activeExtraCategory)
                        }
                        className={`flex flex-col rounded-lg border p-4 transition-all text-left ${
                          isSelected 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="aspect-square w-full rounded-lg bg-secondary mb-3 overflow-hidden">
                          {(product as Product).media?.[0]?.url ? (
                            <img
                              src={(product as Product).media[0].url}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Monitor className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-foreground text-sm line-clamp-2 mb-2">{product.title}</p>
                        <p className="font-bold text-primary mt-auto">R$ {((product as Product).totalPrice || 0).toFixed(2)}</p>
                      </button>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Nenhum produto encontrado nesta categoria
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(filteredItems as HardwareItem[]).map((item) => {
                    const isSelected = selectedComponents[currentStepData.key]?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectComponent(item)}
                        className={`flex flex-col rounded-lg border p-4 transition-all text-left ${
                          isSelected 
                            ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="aspect-square w-full rounded-lg bg-secondary mb-3 overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              {currentStepData && <currentStepData.icon className="h-8 w-8" />}
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-foreground text-sm line-clamp-2 mb-1">
                          {item.brand} {item.model}
                        </p>
                        {item.socket && <p className="text-xs text-muted-foreground">Socket: {item.socket}</p>}
                        {item.memoryType && <p className="text-xs text-muted-foreground">{item.memoryType}</p>}
                        <p className="font-bold text-primary mt-2">R$ {item.price.toFixed(2)}</p>
                      </button>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Nenhum componente compatível encontrado
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome da configuração"
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleSave}
                  disabled={!isComplete}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  Salvar Configuração
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
