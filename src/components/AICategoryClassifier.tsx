import { useState } from 'react';
import { Sparkles, RefreshCw, Check, X, ArrowRight } from 'lucide-react';
import { Category, getCategories } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  categories?: string[];
  productType?: string;
}

interface Classification {
  productId: string;
  productTitle: string;
  currentCategory: string;
  suggestedCategory: string;
  suggestedSubcategory?: string | null;
  newSubcategory?: { key: string; label: string; parentKey: string } | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface AICategoryClassifierProps {
  selectedProducts: Product[];
  onClose: () => void;
  onApply: (updates: { id: string; categories: string[]; productType?: string }[]) => Promise<void>;
}

export function AICategoryClassifier({ selectedProducts, onClose, onApply }: AICategoryClassifierProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [applying, setApplying] = useState(false);
  const [selectedClassifications, setSelectedClassifications] = useState<Set<string>>(new Set());
  const [usage, setUsage] = useState<{ model: string; totalTokens: number; costBrl: number } | null>(null);

  const runClassification = async () => {
    setLoading(true);
    setClassifications([]);
    
    try {
      // Get all categories with subcategories
      const [topLevel, allCategories] = await Promise.all([
        getCategories({ parent: null }),
        getCategories({ all: true })
      ]);
      
      // Build categories with subcategories
      const categoriesWithSubs = topLevel.map(cat => ({
        ...cat,
        subcategories: allCategories.filter(c => c.parentKey === cat.key)
      }));
      
      const response = await fetch('https://www.n8nbalao.com/api/classify-products.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selectedProducts.map(p => ({
            id: p.id,
            title: p.title,
            categories: p.categories,
            productType: p.productType
          })),
          categories: categoriesWithSubs
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setClassifications(data.classifications || []);
        setUsage(data.usage);
        // Select all by default
        setSelectedClassifications(new Set(data.classifications?.map((c: Classification) => c.productId) || []));
      } else {
        toast({ 
          title: 'Erro', 
          description: data.error || 'Falha na classificação', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Classification error:', error);
      toast({ title: 'Erro', description: 'Falha ao conectar com a API', variant: 'destructive' });
    }
    
    setLoading(false);
  };

  const handleApply = async () => {
    const updates = classifications
      .filter(c => selectedClassifications.has(c.productId))
      .map(c => ({
        id: c.productId,
        categories: [c.suggestedCategory, c.suggestedSubcategory].filter(Boolean) as string[],
        productType: c.suggestedCategory
      }));
    
    if (updates.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhuma classificação selecionada', variant: 'destructive' });
      return;
    }
    
    setApplying(true);
    await onApply(updates);
    setApplying(false);
    onClose();
  };

  const toggleSelection = (productId: string) => {
    setSelectedClassifications(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold text-gray-800">Classificação Automática por IA</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {selectedProducts.length} produto(s) selecionado(s) para classificação automática
          </p>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {classifications.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Pronto para classificar
              </h3>
              <p className="text-gray-500 mb-6">
                A IA analisará os títulos dos produtos e sugerirá as melhores categorias.
              </p>
              <button
                onClick={runClassification}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Classificando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Iniciar Classificação
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Usage info */}
              {usage && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center justify-between">
                  <span>Modelo: {usage.model}</span>
                  <span>Tokens: {usage.totalTokens}</span>
                  <span>Custo: R$ {usage.costBrl.toFixed(4)}</span>
                </div>
              )}
              
              {/* Select all */}
              <div className="flex items-center gap-3 pb-2 border-b">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClassifications.size === classifications.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClassifications(new Set(classifications.map(c => c.productId)));
                      } else {
                        setSelectedClassifications(new Set());
                      }
                    }}
                    className="rounded text-primary"
                  />
                  <span className="text-sm font-medium">Selecionar todos</span>
                </label>
                <span className="text-sm text-gray-500">
                  ({selectedClassifications.size} de {classifications.length} selecionados)
                </span>
              </div>
              
              {/* Classifications list */}
              {classifications.map((c) => (
                <div
                  key={c.productId}
                  className={`p-4 rounded-lg border ${
                    selectedClassifications.has(c.productId) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedClassifications.has(c.productId)}
                      onChange={() => toggleSelection(c.productId)}
                      className="mt-1 rounded text-primary"
                    />
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 line-clamp-1">
                        {c.productTitle}
                      </h4>
                      
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">
                          {c.currentCategory || 'Sem categoria'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                          {c.suggestedCategory}
                          {c.suggestedSubcategory && ` / ${c.suggestedSubcategory}`}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(c.confidence)}`}>
                          {c.confidence === 'high' ? 'Alta' : c.confidence === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      
                      {c.reason && (
                        <p className="text-xs text-gray-500 mt-2">{c.reason}</p>
                      )}
                      
                      {c.newSubcategory && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                          Nova subcategoria sugerida: <strong>{c.newSubcategory.label}</strong> em {c.newSubcategory.parentKey}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {classifications.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={runClassification}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Reclassificar
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={applying || selectedClassifications.size === 0}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {applying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Aplicar Selecionados ({selectedClassifications.size})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
