import { useState } from "react";
import { Sparkles, Monitor, Package, Armchair, X, Loader2 } from "lucide-react";
import { api, type HardwareItem, type Product } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ConfigurationType } from "./ConfigurationTypeSelector";

interface AIConfigurationBuilderProps {
  hardware: Record<string, HardwareItem[]>;
  onSave: (product: Partial<Product>) => Promise<void>;
  onClose: () => void;
}

export function AIConfigurationBuilder({ hardware, onSave, onClose }: AIConfigurationBuilderProps) {
  const { toast } = useToast();
  const [budget, setBudget] = useState<number>(3000);
  const [configurationType, setConfigurationType] = useState<ConfigurationType>('pc');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<{
    components: Record<string, HardwareItem>;
    extras?: Record<string, { title: string; price: number }>;
    totalPrice: number;
    title: string;
  } | null>(null);

  const configTypes: { key: ConfigurationType; label: string; icon: typeof Monitor; description: string }[] = [
    { key: 'kit', label: 'Kit', icon: Package, description: 'Processador + Placa-Mãe + Memória' },
    { key: 'pc', label: 'PC Completo', icon: Monitor, description: 'Todos os componentes de hardware' },
    { key: 'setup_completo', label: 'Setup Completo', icon: Armchair, description: 'PC + Cadeira + Periféricos' },
  ];

  const getRequiredComponents = (type: ConfigurationType): string[] => {
    switch (type) {
      case 'kit':
        return ['processor', 'motherboard', 'memory'];
      case 'pc':
        return ['processor', 'motherboard', 'memory', 'storage', 'gpu', 'cooler', 'psu', 'case'];
      case 'setup_completo':
        return ['processor', 'motherboard', 'memory', 'storage', 'gpu', 'cooler', 'psu', 'case'];
      default:
        return [];
    }
  };

  const generateConfiguration = async () => {
    setIsGenerating(true);
    
    try {
      const requiredComponents = getRequiredComponents(configurationType);
      const selectedComponents: Record<string, HardwareItem> = {};
      let remainingBudget = budget;

      // Priority order for budget allocation (most important first)
      const priorityOrder = ['processor', 'gpu', 'motherboard', 'memory', 'storage', 'psu', 'cooler', 'case'];
      
      // Budget allocation percentages based on config type
      const budgetAllocation: Record<string, number> = configurationType === 'kit' 
        ? { processor: 0.45, motherboard: 0.35, memory: 0.20 }
        : { processor: 0.25, gpu: 0.30, motherboard: 0.12, memory: 0.10, storage: 0.08, psu: 0.07, cooler: 0.04, case: 0.04 };

      // Select components based on priority and budget
      for (const componentKey of priorityOrder) {
        if (!requiredComponents.includes(componentKey)) continue;
        
        const componentBudget = budget * (budgetAllocation[componentKey] || 0.1);
        const availableItems = hardware[componentKey] || [];
        
        if (availableItems.length === 0) continue;

        // Find the best item within budget, considering compatibility
        let compatibleItems = availableItems;
        
        // Filter by socket compatibility if processor is selected
        if (componentKey === 'motherboard' && selectedComponents.processor) {
          const processorSocket = selectedComponents.processor.socket;
          if (processorSocket) {
            compatibleItems = availableItems.filter(item => item.socket === processorSocket);
          }
        }
        
        // Filter by memory type if motherboard is selected
        if (componentKey === 'memory' && selectedComponents.motherboard) {
          const motherboardMemoryType = selectedComponents.motherboard.memoryType;
          if (motherboardMemoryType) {
            compatibleItems = availableItems.filter(item => item.memoryType === motherboardMemoryType);
          }
        }

        // Filter by socket for cooler
        if (componentKey === 'cooler' && selectedComponents.processor) {
          const processorSocket = selectedComponents.processor.socket;
          if (processorSocket) {
            compatibleItems = availableItems.filter(item => 
              item.socket === processorSocket || item.socket === 'Universal'
            );
          }
        }

        // Filter by form factor for case
        if (componentKey === 'case' && selectedComponents.motherboard) {
          const motherboardFormFactor = selectedComponents.motherboard.formFactor;
          if (motherboardFormFactor) {
            compatibleItems = availableItems.filter(item => item.formFactor === motherboardFormFactor);
          }
        }

        if (compatibleItems.length === 0) {
          compatibleItems = availableItems; // Fallback to all items if no compatible ones
        }

        // Sort by price and find best within budget
        const sortedItems = [...compatibleItems].sort((a, b) => b.price - a.price);
        const bestItem = sortedItems.find(item => item.price <= componentBudget) || sortedItems[sortedItems.length - 1];
        
        if (bestItem) {
          selectedComponents[componentKey] = bestItem;
        }
      }

      // Calculate total price
      const totalHardwarePrice = Object.values(selectedComponents).reduce((sum, item) => sum + item.price, 0);

      // Generate title based on main components
      const processor = selectedComponents.processor;
      const gpu = selectedComponents.gpu;
      let title = '';
      
      if (configurationType === 'kit') {
        title = `Kit ${processor?.brand || ''} ${processor?.model || ''} + ${selectedComponents.motherboard?.brand || ''} + ${selectedComponents.memory?.brand || ''} RAM`;
      } else {
        title = `PC ${processor?.brand || ''} ${processor?.model || ''} ${gpu ? `+ ${gpu.brand} ${gpu.model}` : ''}`;
      }

      setGeneratedConfig({
        components: selectedComponents,
        totalPrice: totalHardwarePrice,
        title: title.trim(),
      });

      toast({ title: "Configuração gerada!", description: `Total: R$ ${totalHardwarePrice.toFixed(2)}` });
    } catch (error) {
      console.error('Error generating configuration:', error);
      toast({ title: "Erro", description: "Falha ao gerar configuração", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedConfig) return;

    const componentIds: Record<string, string> = {};
    Object.entries(generatedConfig.components).forEach(([key, item]) => {
      componentIds[key] = item.id;
    });

    const productType = configurationType === 'kit' ? 'kit' : 'pc';

    await onSave({
      title: generatedConfig.title,
      subtitle: `Configuração montada com IA - Orçamento: R$ ${budget.toFixed(2)}`,
      description: `Configuração ${configurationType === 'kit' ? 'Kit' : configurationType === 'pc' ? 'PC Completo' : 'Setup Completo'} gerada automaticamente pela IA com base no orçamento de R$ ${budget.toFixed(2)}.`,
      categories: [],
      media: [],
      specs: {},
      components: generatedConfig.components,
      totalPrice: generatedConfig.totalPrice,
      productType,
    });
  };

  const componentLabels: Record<string, string> = {
    processor: 'Processador',
    motherboard: 'Placa-Mãe',
    memory: 'Memória RAM',
    storage: 'Armazenamento',
    gpu: 'Placa de Vídeo',
    cooler: 'Cooler',
    psu: 'Fonte',
    case: 'Gabinete',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="w-full max-w-3xl rounded-xl bg-card p-8 shadow-xl border border-border mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}>
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Montar com IA</h2>
              <p className="text-sm text-muted-foreground">A IA vai selecionar os melhores componentes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!generatedConfig ? (
          <>
            {/* Budget Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Orçamento Máximo (R$)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min={500}
                max={50000}
                step={100}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground text-lg font-semibold focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A IA vai otimizar a seleção para ficar dentro deste valor
              </p>
            </div>

            {/* Configuration Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                Tipo de Configuração
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {configTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.key}
                      onClick={() => setConfigurationType(type.key)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                        configurationType === type.key
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className={`h-8 w-8 ${configurationType === type.key ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-medium ${configurationType === type.key ? 'text-primary' : 'text-foreground'}`}>
                        {type.label}
                      </span>
                      <span className="text-xs text-muted-foreground text-center">{type.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateConfiguration}
              disabled={isGenerating}
              className="w-full py-4 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Gerando configuração...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Gerar Configuração
                </>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Generated Configuration */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Configuração Gerada
              </h3>
              
              <div className="rounded-lg border border-border p-4 mb-4">
                <input
                  type="text"
                  value={generatedConfig.title}
                  onChange={(e) => setGeneratedConfig({ ...generatedConfig, title: e.target.value })}
                  className="w-full bg-transparent text-lg font-bold text-foreground border-none focus:outline-none"
                />
              </div>

              <div className="space-y-2 mb-4">
                {Object.entries(generatedConfig.components).map(([key, item]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-24">
                        {componentLabels[key] || key}
                      </span>
                      <span className="font-medium text-foreground">
                        {item.brand} {item.model}
                      </span>
                    </div>
                    <span className="font-semibold text-primary">
                      R$ {item.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {generatedConfig.totalPrice.toFixed(2)}
                </span>
              </div>

              {budget - generatedConfig.totalPrice > 0 && (
                <p className="text-sm text-green-600 mt-2 text-center">
                  Economia de R$ {(budget - generatedConfig.totalPrice).toFixed(2)} do orçamento
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setGeneratedConfig(null)}
                className="flex-1 py-3 rounded-lg border border-border font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Gerar Novamente
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Salvar Configuração
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
