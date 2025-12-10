import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Check, X, ArrowRight, Plus, AlertTriangle, Image } from 'lucide-react';
import { Category, getCategories, addCategory } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  title: string;
  categories?: string[];
  productType?: string;
  media?: any;
}

interface NewCategory {
  key: string;
  label: string;
  parentKey?: string | null;
  icon?: string;
}

interface NewCompatibility {
  productId: string;
  socket?: string;
  memoryType?: string;
  formFactor?: string;
  tdp?: number;
}

interface Classification {
  productId: string;
  productTitle: string;
  currentCategory: string;
  currentProductType: string;
  suggestedCategory: string;
  suggestedSubcategory?: string | null;
  suggestedProductType: string;
  newCategory?: NewCategory | null;
  newSubcategory?: NewCategory | null;
  compatibility?: NewCompatibility | null;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  newImages?: string[];
}

interface AICategoryClassifierProps {
  selectedProducts?: Product[];
  allProducts?: Product[];
  onClose: () => void;
  onApply: (updates: { id: string; categories: string[]; productType?: string; compatibility?: NewCompatibility; newImages?: string[] }[]) => Promise<void>;
  onAutoSelect?: (count: number) => Product[];
}

export function AICategoryClassifier({ 
  selectedProducts = [], 
  allProducts = [],
  onClose, 
  onApply,
  onAutoSelect 
}: AICategoryClassifierProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [applying, setApplying] = useState(false);
  const [selectedClassifications, setSelectedClassifications] = useState<Set<string>>(new Set());
  const [usage, setUsage] = useState<{ model: string; totalTokens: number; costBrl: number } | null>(null);
  
  // New categories pending confirmation
  const [pendingCategories, setPendingCategories] = useState<NewCategory[]>([]);
  const [showCategoryConfirm, setShowCategoryConfirm] = useState(false);
  const [confirmedCategories, setConfirmedCategories] = useState<Set<string>>(new Set());
  
  // Products to classify (auto-selected or provided)
  const [productsToClassify, setProductsToClassify] = useState<Product[]>(selectedProducts);

  // Auto-start classification when component mounts
  useEffect(() => {
    // Only auto-start if no products were pre-selected
    if (selectedProducts.length === 0 && onAutoSelect) {
      runClassification();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runClassification = async () => {
    // If no products selected and onAutoSelect is available, auto-select next 1
    let products = productsToClassify;
    if (products.length === 0 && onAutoSelect) {
      products = onAutoSelect(1);
      setProductsToClassify(products);
    }
    
    if (products.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum produto para classificar', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    setClassifications([]);
    setPendingCategories([]);
    
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
          products: products.map(p => ({
            id: p.id,
            title: p.title,
            categories: p.categories,
            productType: p.productType
          })),
          categories: categoriesWithSubs,
          allowNewCategories: true,
          detectCompatibility: true
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        toast({ 
          title: 'Erro na API', 
          description: `Status ${response.status}: ${errorText.substring(0, 100)}`, 
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        const classificationsWithData = data.classifications || [];
        
        setClassifications(classificationsWithData);
        setUsage(data.usage);
        // Select all by default
        setSelectedClassifications(new Set(classificationsWithData.map((c: Classification) => c.productId)));
        
        // Collect new categories/subcategories that need confirmation
        const newCats: NewCategory[] = [];
        for (const c of classificationsWithData) {
          if (c.newCategory) {
            newCats.push(c.newCategory);
          }
          if (c.newSubcategory) {
            newCats.push(c.newSubcategory);
          }
        }
        
        // Remove duplicates
        const uniqueCats = newCats.filter((cat, index, self) => 
          index === self.findIndex(c => c.key === cat.key)
        );
        
        if (uniqueCats.length > 0) {
          setPendingCategories(uniqueCats);
          // Auto-select all new categories for confirmation
          setConfirmedCategories(new Set(uniqueCats.map(c => c.key)));
        }
      } else {
        toast({ 
          title: 'Erro', 
          description: data.error || 'Falha na classificação', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Classification error:', error);
      const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro de conexão', description: errMsg, variant: 'destructive' });
    }
    
    setLoading(false);
  };

  const handleConfirmCategories = async () => {
    // Create confirmed categories in database
    for (const cat of pendingCategories) {
      if (confirmedCategories.has(cat.key)) {
        try {
          await addCategory({
            key: cat.key,
            label: cat.label,
            icon: cat.icon || 'Package',
            parentKey: cat.parentKey || null
          });
        } catch (error) {
          console.error('Error creating category:', cat.key, error);
        }
      }
    }
    
    setShowCategoryConfirm(false);
    toast({ 
      title: 'Categorias criadas', 
      description: `${confirmedCategories.size} categoria(s) criada(s) com sucesso` 
    });
    
    // Now apply classifications
    await applyClassifications();
  };

  const applyClassifications = async () => {
    const updates = classifications
      .filter(c => selectedClassifications.has(c.productId))
      .map(c => ({
        id: c.productId,
        categories: [c.suggestedCategory, c.suggestedSubcategory].filter(Boolean) as string[],
        productType: c.suggestedProductType || c.suggestedCategory,
        compatibility: c.compatibility || undefined,
        newImages: c.newImages || []
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

  const handleApply = async () => {
    // If there are pending categories, show confirmation first
    if (pendingCategories.length > 0 && confirmedCategories.size > 0) {
      setShowCategoryConfirm(true);
      return;
    }
    
    // Otherwise apply directly
    await applyClassifications();
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

  const toggleCategoryConfirm = (key: string) => {
    setConfirmedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
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

  // Category confirmation modal
  if (showCategoryConfirm && pendingCategories.length > 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-800">Criar Categorias Sugeridas</h2>
            </div>
            <p className="text-gray-600 mt-2">
              A IA sugeriu as seguintes novas categorias. Selecione quais deseja criar:
            </p>
          </div>
          
          <div className="p-6 space-y-3 max-h-[40vh] overflow-y-auto">
            {pendingCategories.map((cat) => (
              <label 
                key={cat.key}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  confirmedCategories.has(cat.key) 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={confirmedCategories.has(cat.key)}
                  onChange={() => toggleCategoryConfirm(cat.key)}
                  className="rounded text-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-gray-800">{cat.label}</span>
                    <span className="text-xs text-gray-500">({cat.key})</span>
                  </div>
                  {cat.parentKey && (
                    <p className="text-sm text-gray-500 mt-1">
                      Subcategoria de: <span className="font-medium">{cat.parentKey}</span>
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
          
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
            <button
              onClick={() => {
                setShowCategoryConfirm(false);
                // Apply without creating categories
                applyClassifications();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Pular (Usar Existentes)
            </button>
            <div className="flex-1" />
            <button
              onClick={() => {
                setConfirmedCategories(new Set(pendingCategories.map(c => c.key)));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Selecionar Todos
            </button>
            <button
              onClick={handleConfirmCategories}
              disabled={confirmedCategories.size === 0}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Criar e Aplicar ({confirmedCategories.size})
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {productsToClassify.length > 0 
              ? `${productsToClassify.length} produto(s) para classificação`
              : 'Clique para classificar automaticamente'
            }
          </p>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Classificando produto...
              </h3>
              <p className="text-gray-500">
                Analisando título, sugerindo categoria e tipo de produto
              </p>
            </div>
          ) : classifications.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Pronto para classificar
              </h3>
              <p className="text-gray-500 mb-6">
                A IA analisará o produto e sugerirá categoria e tipo adequados.
              </p>
              <button
                onClick={runClassification}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                <Sparkles className="h-5 w-5" />
                Classificar
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
                      
                      {/* Category Classification */}
                      <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
                        <span className="text-gray-500 text-xs">Categoria:</span>
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">
                          {c.currentCategory || 'Sem categoria'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="px-2 py-1 rounded bg-primary/20 text-primary font-medium">
                          {c.suggestedCategory}
                          {c.suggestedSubcategory && ` / ${c.suggestedSubcategory}`}
                        </span>
                      </div>
                      
                      {/* Product Type Classification */}
                      <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
                        <span className="text-gray-500 text-xs">Tipo:</span>
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">
                          {c.currentProductType || 'Sem tipo'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                          {c.suggestedProductType || c.suggestedCategory}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceColor(c.confidence)}`}>
                          {c.confidence === 'high' ? 'Alta' : c.confidence === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                      </div>
                      
                      {c.reason && (
                        <p className="text-xs text-gray-500 mt-2">{c.reason}</p>
                      )}
                      
                      {(c.newCategory || c.newSubcategory) && (
                        <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-800 flex items-center gap-2">
                          <Plus className="h-3 w-3" />
                          <span>
                            {c.newCategory && `Nova categoria: ${c.newCategory.label}`}
                            {c.newCategory && c.newSubcategory && ' | '}
                            {c.newSubcategory && `Nova subcategoria: ${c.newSubcategory.label}`}
                          </span>
                        </div>
                      )}
                      
                      {c.compatibility && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800 flex items-center gap-2 flex-wrap">
                          <span className="font-medium">Compatibilidade:</span>
                          {c.compatibility.socket && <span>Socket: {c.compatibility.socket}</span>}
                          {c.compatibility.memoryType && <span>Memória: {c.compatibility.memoryType}</span>}
                          {c.compatibility.formFactor && <span>Form Factor: {c.compatibility.formFactor}</span>}
                          {c.compatibility.tdp && <span>TDP: {c.compatibility.tdp}W</span>}
                        </div>
                      )}

                      {/* New Images Preview */}
                      {c.newImages && c.newImages.length > 0 && (
                        <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-purple-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Image className="h-3 w-3" />
                            <span className="font-medium">{c.newImages.length} imagem(ns) encontrada(s)</span>
                          </div>
                          <div className="flex gap-2 overflow-x-auto">
                            {c.newImages.slice(0, 3).map((img, idx) => (
                              <img 
                                key={idx} 
                                src={img} 
                                alt={`Preview ${idx + 1}`}
                                className="w-12 h-12 object-cover rounded border"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            ))}
                          </div>
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
            <div className="flex gap-3 flex-wrap">
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
                {pendingCategories.length > 0 
                  ? `Aplicar (${selectedClassifications.size}) + Criar Categorias` 
                  : `Aplicar (${selectedClassifications.size})`
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
