import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StarryBackground } from "@/components/StarryBackground";

import { api, type Product, type HardwareItem, type CompanyData, type HardwareCategory, getCustomCategories } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, Printer, ShoppingCart, ArrowLeft, Plus, X, Search, Package, ChevronRight, Cpu, Minus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

// Hardware steps for PC assembly
const hardwareSteps: { key: HardwareCategory; label: string; required: boolean; allowMultiple: boolean }[] = [
  { key: 'processor', label: 'Processador', required: true, allowMultiple: false },
  { key: 'motherboard', label: 'Placa Mãe', required: true, allowMultiple: false },
  { key: 'memory', label: 'Memória RAM', required: true, allowMultiple: true },
  { key: 'storage', label: 'Armazenamento', required: true, allowMultiple: true },
  { key: 'gpu', label: 'Placa de Vídeo', required: false, allowMultiple: false },
  { key: 'cooler', label: 'Cooler', required: false, allowMultiple: false },
  { key: 'psu', label: 'Fonte', required: true, allowMultiple: false },
  { key: 'case', label: 'Gabinete', required: true, allowMultiple: false },
];

// Categories that allow multiple selections in extras phase
const multipleAllowedCategories = ['monitor'];

// Product categories for additional items
const defaultCategories = [
  { key: 'pc', label: 'PCs' },
  { key: 'kit', label: 'Kits' },
  { key: 'notebook', label: 'Notebooks' },
  { key: 'acessorio', label: 'Acessórios' },
  { key: 'software', label: 'Softwares' },
  { key: 'automacao', label: 'Automações' },
  { key: 'licenca', label: 'Licenças' },
  { key: 'monitor', label: 'Monitores' },
  { key: 'cadeira_gamer', label: 'Cadeiras Gamer' },
];

interface SelectedHardware {
  [key: string]: HardwareItem | HardwareItem[] | null;
}

interface SelectedProduct {
  id: string;
  title: string;
  price: number;
  category: string;
  uniqueKey: string; // Unique key for each instance (allows duplicates)
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

type Phase = 'hardware' | 'extras' | 'quote';

export default function MonteVoceMesmo() {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>('hardware');
  const [currentStep, setCurrentStep] = useState(0);
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [selectedHardware, setSelectedHardware] = useState<SelectedHardware>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    cnpj: '',
    seller: '',
    logo: ''
  });
  const quoteRef = useRef<HTMLDivElement>(null);

  const allCategories = [...defaultCategories, ...getCustomCategories()];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (phase === 'hardware') {
      loadHardwareForStep();
    }
  }, [currentStep, phase, selectedHardware]);

  async function fetchData() {
    setLoading(true);
    try {
      const company = await api.getCompany();
      setCompanyData(company);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    }
    setLoading(false);
    loadHardwareForStep();
  }

  async function loadHardwareForStep() {
    if (currentStep >= hardwareSteps.length) return;
    
    const step = hardwareSteps[currentStep];
    setLoading(true);
    try {
      let items = await api.getHardware(step.key);
      
      // Apply compatibility filtering
      items = filterCompatibleHardware(items, step.key);
      
      setHardware(items.sort((a, b) => a.price - b.price));
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar componentes", variant: "destructive" });
    }
    setLoading(false);
  }

  function filterCompatibleHardware(items: HardwareItem[], category: HardwareCategory): HardwareItem[] {
    const processorValue = selectedHardware['processor'];
    const processor = Array.isArray(processorValue) ? processorValue[0] : processorValue;
    const motherboardValue = selectedHardware['motherboard'];
    const motherboard = Array.isArray(motherboardValue) ? motherboardValue[0] : motherboardValue;

    return items.filter(item => {
      // Motherboard must match processor socket (only if both have socket defined)
      if (category === 'motherboard' && processor?.socket && item.socket) {
        if (item.socket !== processor.socket) return false;
      }

      // Memory must match motherboard memory type (only if both have memoryType defined)
      if (category === 'memory' && motherboard?.memoryType && item.memoryType) {
        if (item.memoryType !== motherboard.memoryType) return false;
      }

      return true;
    });
  }

  function selectHardware(item: HardwareItem) {
    const step = hardwareSteps[currentStep];
    
    if (step.allowMultiple) {
      // For multiple selection, always add (allow duplicates)
      setSelectedHardware(prev => {
        const current = prev[step.key];
        const currentArray = Array.isArray(current) ? current : current ? [current] : [];
        return { ...prev, [step.key]: [...currentArray, item] };
      });
      toast({ title: "Adicionado!", description: `${item.brand} ${item.model}` });
    } else {
      // Single selection
      setSelectedHardware(prev => ({ ...prev, [step.key]: item }));
      toast({ title: "Selecionado!", description: `${item.brand} ${item.model}` });
      
      // Auto advance to next step only for single selection
      if (currentStep < hardwareSteps.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 300);
      }
    }
  }

  function removeOneHardwareItem(stepKey: string, itemId: string) {
    setSelectedHardware(prev => {
      const current = prev[stepKey];
      if (Array.isArray(current)) {
        // Remove only the first occurrence
        const idx = current.findIndex(h => h.id === itemId);
        if (idx >= 0) {
          const newArray = [...current];
          newArray.splice(idx, 1);
          return { ...prev, [stepKey]: newArray.length > 0 ? newArray : null };
        }
      }
      return { ...prev, [stepKey]: null };
    });
  }

  function getItemCount(stepKey: string, itemId: string): number {
    const current = selectedHardware[stepKey];
    if (Array.isArray(current)) {
      return current.filter(h => h.id === itemId).length;
    }
    return current?.id === itemId ? 1 : 0;
  }

  function removeHardwareItem(stepKey: string, itemId: string) {
    setSelectedHardware(prev => {
      const current = prev[stepKey];
      if (Array.isArray(current)) {
        const newArray = current.filter(h => h.id !== itemId);
        return { ...prev, [stepKey]: newArray.length > 0 ? newArray : null };
      }
      return { ...prev, [stepKey]: null };
    });
  }

  function skipStep() {
    const step = hardwareSteps[currentStep];
    if (step.required) {
      toast({ title: "Obrigatório", description: "Este componente é obrigatório", variant: "destructive" });
      return;
    }
    setSelectedHardware(prev => ({ ...prev, [step.key]: null }));
    if (currentStep < hardwareSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }

  function calculateHardwareTotal(): number {
    return Object.values(selectedHardware).reduce((sum, item) => {
      if (Array.isArray(item)) {
        return sum + item.reduce((s, h) => s + h.price, 0);
      }
      return sum + (item?.price || 0);
    }, 0);
  }

  function calculateProductsTotal(): number {
    return selectedProducts.reduce((sum, item) => sum + item.price, 0);
  }

  function calculateTotal(): number {
    return calculateHardwareTotal() + calculateProductsTotal();
  }

  function finishHardwareSelection() {
    // Check required components
    const missing = hardwareSteps.filter(step => {
      const value = selectedHardware[step.key];
      if (!step.required) return false;
      if (Array.isArray(value)) return value.length === 0;
      return !value;
    });
    if (missing.length > 0) {
      toast({ 
        title: "Componentes obrigatórios faltando", 
        description: missing.map(s => s.label).join(', '),
        variant: "destructive" 
      });
      return;
    }
    
    // Load products for extras phase
    loadProducts();
    setPhase('extras');
  }

  async function loadProducts() {
    setLoading(true);
    try {
      const productsData = await api.getProducts();
      setProducts(productsData.sort((a, b) => a.totalPrice - b.totalPrice));
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar produtos", variant: "destructive" });
    }
    setLoading(false);
  }

  function addProduct(product: Product) {
    setSelectedProducts(prev => [...prev, {
      id: product.id,
      title: product.title,
      price: product.totalPrice,
      category: product.categories?.[0] || product.productType || 'outro',
      uniqueKey: `${product.id}-${Date.now()}-${Math.random()}`
    }]);

    toast({ title: "Adicionado!", description: product.title });
  }

  function removeOneProduct(productId: string) {
    setSelectedProducts(prev => {
      const idx = prev.findIndex(p => p.id === productId);
      if (idx >= 0) {
        const newArray = [...prev];
        newArray.splice(idx, 1);
        return newArray;
      }
      return prev;
    });
  }

  function getProductCount(productId: string): number {
    return selectedProducts.filter(p => p.id === productId).length;
  }

  function removeProduct(uniqueKey: string) {
    setSelectedProducts(prev => prev.filter(p => p.uniqueKey !== uniqueKey));
  }

  function generateQuote() {
    setPhase('quote');
  }

  function printQuote() {
    const printContent = quoteRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orçamento - ${companyData.name || 'Orçamento'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .quote-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-title { font-size: 28px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
            .store-info { font-size: 12px; color: #666; line-height: 1.6; }
            .quote-title { font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; }
            .quote-date { text-align: right; font-size: 14px; color: #666; margin-bottom: 20px; }
            .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px; border-bottom: 2px solid #e5e5e5; padding-bottom: 5px; }
            .components-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .components-table th { background: #3b82f6; color: white; padding: 12px; text-align: left; }
            .components-table td { padding: 12px; border-bottom: 1px solid #ddd; }
            .components-table tr:nth-child(even) { background: #f8f9fa; }
            .total-row { background: #e0f2fe !important; font-weight: bold; font-size: 18px; }
            .validity { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .validity strong { color: #d97706; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .thank-you { font-size: 16px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  function handleBuy() {
    toast({ 
      title: "Pedido Enviado!", 
      description: "Em breve entraremos em contato para finalizar sua compra.",
    });
  }

  function getCategoryLabel(key: string): string {
    const found = allCategories.find(c => c.key === key);
    return found?.label || key;
  }

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = !searchTerm || 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const productCategory = product.categories?.[0] || product.productType || '';
      const matchesCategory = !activeCategory || productCategory === activeCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0));

  const emissionDate = new Date();
  const validityDate = new Date(emissionDate);
  validityDate.setDate(validityDate.getDate() + 7);

  if (loading && phase === 'hardware' && hardware.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // PHASE: Quote Display
  if (phase === 'quote') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Button variant="outline" onClick={() => setPhase('extras')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={printQuote}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
                <Button onClick={handleBuy} className="bg-green-600 hover:bg-green-700">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Comprar
                </Button>
              </div>
            </div>

            <Card className="p-8 bg-white text-gray-800" ref={quoteRef}>
              <div className="quote-container">
                {/* Header */}
                <div className="header text-center border-b-4 border-primary pb-6 mb-8">
                  {companyData.logo && (
                    <img src={companyData.logo} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
                  )}
                  <div className="logo-title text-3xl font-bold text-primary mb-2">
                    {companyData.name || 'Empresa'}
                  </div>
                  <div className="store-info text-sm text-muted-foreground space-y-1">
                    {(companyData.address || companyData.city) && (
                      <p>{companyData.address}{companyData.address && companyData.city && ' - '}{companyData.city}</p>
                    )}
                    {(companyData.phone || companyData.email) && (
                      <p>
                        {companyData.phone && `Tel: ${companyData.phone}`}
                        {companyData.phone && companyData.email && ' | '}
                        {companyData.email && `Email: ${companyData.email}`}
                      </p>
                    )}
                    {companyData.cnpj && <p>CNPJ: {companyData.cnpj}</p>}
                    {companyData.seller && <p>Vendedor: {companyData.seller}</p>}
                  </div>
                </div>

                <h2 className="quote-title text-2xl font-bold text-center mb-4">ORÇAMENTO</h2>
                <div className="quote-date text-right text-sm text-muted-foreground mb-6">
                  Data de Emissão: {formatDate(emissionDate)}
                </div>

                {/* Hardware Components */}
                {Object.values(selectedHardware).some(v => v) && (
                  <>
                    <h3 className="section-title text-lg font-bold border-b-2 border-border pb-2 mb-4">
                      Montagem de PC
                    </h3>
                    <table className="components-table w-full border-collapse mb-6">
                      <thead>
                        <tr>
                          <th className="bg-primary text-primary-foreground p-3 text-left">Componente</th>
                          <th className="bg-primary text-primary-foreground p-3 text-left">Descrição</th>
                          <th className="bg-primary text-primary-foreground p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hardwareSteps.map((step) => {
                          const item = selectedHardware[step.key];
                          if (!item) return null;
                          
                          // Handle array (multiple items)
                          if (Array.isArray(item)) {
                            return item.map((h, idx) => (
                              <tr key={`${step.key}-${idx}`} className="border-b border-border">
                                <td className="p-3 font-medium">{step.label} {item.length > 1 ? `#${idx + 1}` : ''}</td>
                                <td className="p-3">{h.brand} {h.model}</td>
                                <td className="p-3 text-right">{formatPrice(h.price)}</td>
                              </tr>
                            ));
                          }
                          
                          // Single item
                          return (
                            <tr key={step.key} className="border-b border-border">
                              <td className="p-3 font-medium">{step.label}</td>
                              <td className="p-3">{item.brand} {item.model}</td>
                              <td className="p-3 text-right">{formatPrice(item.price)}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-primary/10 font-bold">
                          <td className="p-3" colSpan={2}>Subtotal PC</td>
                          <td className="p-3 text-right">{formatPrice(calculateHardwareTotal())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {/* Additional Products */}
                {selectedProducts.length > 0 && (
                  <>
                    <h3 className="section-title text-lg font-bold border-b-2 border-border pb-2 mb-4">
                      Itens Adicionais
                    </h3>
                    <table className="components-table w-full border-collapse mb-6">
                      <thead>
                        <tr>
                          <th className="bg-primary text-primary-foreground p-3 text-left">Categoria</th>
                          <th className="bg-primary text-primary-foreground p-3 text-left">Produto</th>
                          <th className="bg-primary text-primary-foreground p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProducts.map((item) => (
                          <tr key={item.id} className="border-b border-border">
                            <td className="p-3 font-medium">{getCategoryLabel(item.category)}</td>
                            <td className="p-3">{item.title}</td>
                            <td className="p-3 text-right">{formatPrice(item.price)}</td>
                          </tr>
                        ))}
                        <tr className="bg-primary/10 font-bold">
                          <td className="p-3" colSpan={2}>Subtotal Adicionais</td>
                          <td className="p-3 text-right">{formatPrice(calculateProductsTotal())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {/* Total */}
                <table className="components-table w-full border-collapse mb-6">
                  <tbody>
                    <tr className="total-row bg-primary/20 font-bold text-lg">
                      <td className="p-4">TOTAL GERAL</td>
                      <td className="p-4 text-right text-primary">{formatPrice(calculateTotal())}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Validity */}
                <div className="validity bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center mb-8">
                  <p>
                    <strong className="text-yellow-700">⚠️ Validade:</strong>{" "}
                    <span className="font-semibold">{formatDate(validityDate)}</span> (7 dias)
                  </p>
                </div>

                {/* Footer */}
                <div className="footer text-center pt-6 border-t border-border">
                  <p className="thank-you text-lg font-bold text-primary mb-2">
                    Obrigado pela preferência!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Para confirmar seu pedido, entre em contato conosco.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // PHASE: Hardware Selection
  if (phase === 'hardware') {
    const currentStepData = hardwareSteps[currentStep];
    const selectedCount = Object.values(selectedHardware).filter(v => v).length;

    return (
      <div className="min-h-screen flex flex-col relative">
        <StarryBackground />
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">Monte Seu PC</h1>
              <p className="text-muted-foreground">Selecione os componentes para montar seu computador</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Passo {currentStep + 1} de {hardwareSteps.length}</span>
                <span className="text-sm font-medium">{selectedCount} componentes selecionados</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / hardwareSteps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Step Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {hardwareSteps.map((step, index) => {
                const selection = selectedHardware[step.key];
                const isSelected = Array.isArray(selection) ? selection.length > 0 : !!selection;
                const count = Array.isArray(selection) ? selection.length : (selection ? 1 : 0);
                const isCurrent = index === currentStep;
                return (
                  <Button
                    key={step.key}
                    variant={isCurrent ? "default" : isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStep(index)}
                    className={isSelected && !isCurrent ? "border-green-500" : ""}
                  >
                    {isSelected && <Check className="h-3 w-3 mr-1" />}
                    {step.label}
                    {step.allowMultiple && count > 1 && <span className="ml-1 text-xs">({count})</span>}
                    {step.required && !isSelected && <span className="text-destructive ml-1">*</span>}
                  </Button>
                );
              })}
            </div>

            {/* Current Selection Summary */}
            {calculateHardwareTotal() > 0 && (
              <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    <span className="font-medium">Total do PC:</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{formatPrice(calculateHardwareTotal())}</span>
                </div>
              </div>
            )}

            {/* Current Step */}
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      {currentStepData.label}
                      {currentStepData.required && <span className="text-destructive ml-1">*</span>}
                    </h2>
                    {currentStepData.allowMultiple && (
                      <p className="text-sm text-muted-foreground">Você pode selecionar vários itens</p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">({hardware.length} itens)</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
                    className="gap-1"
                  >
                    {viewMode === 'card' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                    {viewMode === 'card' ? 'Lista' : 'Cards'}
                  </Button>
                  {currentStepData.allowMultiple && (
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => setCurrentStep(prev => Math.min(hardwareSteps.length - 1, prev + 1))}
                      disabled={currentStep >= hardwareSteps.length - 1}
                    >
                      Continuar
                    </Button>
                  )}
                  {!currentStepData.required && (
                    <Button variant="ghost" size="sm" onClick={skipStep}>
                      Pular
                    </Button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : hardware.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum componente disponível</p>
                </div>
              ) : viewMode === 'card' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 max-h-[70vh] overflow-y-auto">
                  {hardware.map((item) => {
                    const itemCount = getItemCount(currentStepData.key, item.id);
                    const isSelected = itemCount > 0;
                    
                    return (
                      <HoverCard key={item.id} openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <div
                            onClick={() => !currentStepData.allowMultiple && selectHardware(item)}
                            className={`p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              isSelected 
                                ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <p className="font-medium text-xs line-clamp-2 mb-1">{item.brand} {item.model}</p>
                            <p className="text-sm font-bold text-primary">{formatPrice(item.price)}</p>
                            
                            {currentStepData.allowMultiple ? (
                              <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                                <span className="text-[10px] text-muted-foreground">{itemCount}x</span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeOneHardwareItem(currentStepData.key, item.id);
                                    }}
                                    disabled={itemCount === 0}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="font-bold w-4 text-center text-xs">{itemCount}</span>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectHardware(item);
                                    }}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : isSelected ? (
                              <div className="pt-2 mt-2 border-t border-border flex justify-center">
                                <span className="flex items-center gap-1 text-green-500 text-[10px]">
                                  <Check className="h-3 w-3" /> Selecionado
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" className="w-64 p-3">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={`${item.brand} ${item.model}`}
                              className="w-full h-40 object-contain rounded-lg bg-muted mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-2">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <p className="font-semibold text-sm">{item.brand} {item.model}</p>
                          <p className="text-xs text-muted-foreground">{item.name}</p>
                          <p className="font-bold text-primary mt-1">{formatPrice(item.price)}</p>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {hardware.map((item) => {
                    const itemCount = getItemCount(currentStepData.key, item.id);
                    const isSelected = itemCount > 0;
                    
                    return (
                      <HoverCard key={item.id} openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <div
                            onClick={() => !currentStepData.allowMultiple && selectHardware(item)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              isSelected 
                                ? 'border-green-500 bg-green-500/10' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{item.brand} {item.model}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-bold text-primary">{formatPrice(item.price)}</p>
                              {currentStepData.allowMultiple ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeOneHardwareItem(currentStepData.key, item.id);
                                    }}
                                    disabled={itemCount === 0}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="font-bold w-6 text-center text-sm">{itemCount}</span>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectHardware(item);
                                    }}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : isSelected ? (
                                <span className="flex items-center gap-1 text-green-500 text-sm">
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" className="w-64 p-3">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={`${item.brand} ${item.model}`}
                              className="w-full h-40 object-contain rounded-lg bg-muted mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-2">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <p className="font-semibold text-sm">{item.brand} {item.model}</p>
                          <p className="text-xs text-muted-foreground">{item.name}</p>
                          <p className="font-bold text-primary mt-1">{formatPrice(item.price)}</p>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              
              {currentStep === hardwareSteps.length - 1 ? (
                <Button onClick={finishHardwareSelection} className="bg-green-600 hover:bg-green-700">
                  Continuar para Extras
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(prev => Math.min(hardwareSteps.length - 1, prev + 1))}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // PHASE: Extras (Additional Products)
  return (
    <div className="min-h-screen flex flex-col relative">
      <StarryBackground />
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Adicionar Itens Extras</h1>
            <p className="text-muted-foreground">Selecione a categoria e escolha produtos adicionais para seu orçamento</p>
          </div>

          {/* Summary Bar */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 mb-6 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4" />
                  <span>PC Montado:</span>
                  <span className="font-bold">{formatPrice(calculateHardwareTotal())}</span>
                </div>
                {selectedProducts.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    <span>{selectedProducts.length} extra(s):</span>
                    <span className="font-bold">{formatPrice(calculateProductsTotal())}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Geral</p>
                  <p className="text-xl font-bold text-primary">{formatPrice(calculateTotal())}</p>
                </div>
                <Button onClick={generateQuote} className="bg-green-600 hover:bg-green-700">
                  Gerar Orçamento
                </Button>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <Button variant="outline" onClick={() => setPhase('hardware')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Hardware
          </Button>

          {/* Category Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Selecione uma Categoria</h3>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(cat => {
                const count = products.filter(p => 
                  (p.categories?.[0] || p.productType) === cat.key
                ).length;
                if (count === 0) return null;
                return (
                  <Button
                    key={cat.key}
                    variant={activeCategory === cat.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                  >
                    {cat.label} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Products List (only shown when category is selected) */}
          {activeCategory && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{getCategoryLabel(activeCategory)}</h3>
                  <span className="text-sm text-muted-foreground">({filteredProducts.length} itens)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
                    className="gap-1"
                  >
                    {viewMode === 'card' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                    {viewMode === 'card' ? 'Lista' : 'Cards'}
                  </Button>
                  <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum produto encontrado</p>
                </div>
              ) : viewMode === 'card' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 max-h-[70vh] overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const count = getProductCount(product.id);
                    const isSelected = count > 0;
                    const productImage = product.media?.[0]?.url;
                    return (
                      <HoverCard key={product.id}>
                        <HoverCardTrigger asChild>
                          <div
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-green-500 bg-green-500/10' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <p className="font-medium text-xs line-clamp-2 mb-1">{product.title}</p>
                            <p className="text-sm font-bold text-primary">{formatPrice(product.totalPrice)}</p>
                            
                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                              <span className="text-[10px] text-muted-foreground">{count}x</span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeOneProduct(product.id);
                                  }}
                                  disabled={count === 0}
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-bold w-4 text-center text-xs">{count}</span>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addProduct(product);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" className="w-64 p-3">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={product.title}
                              className="w-full h-40 object-contain rounded-lg bg-muted mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-2">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <p className="font-semibold text-sm">{product.title}</p>
                          {product.subtitle && (
                            <p className="text-xs text-muted-foreground">{product.subtitle}</p>
                          )}
                          <p className="font-bold text-primary mt-1">{formatPrice(product.totalPrice)}</p>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const count = getProductCount(product.id);
                    const isSelected = count > 0;
                    const productImage = product.media?.[0]?.url;
                    
                    return (
                      <HoverCard key={product.id} openDelay={200} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <div
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              isSelected 
                                ? 'border-green-500 bg-green-500/10' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{product.title}</p>
                              {product.subtitle && (
                                <p className="text-xs text-muted-foreground truncate">{product.subtitle}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-bold text-primary">{formatPrice(product.totalPrice)}</p>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeOneProduct(product.id);
                                  }}
                                  disabled={count === 0}
                                  className="h-7 w-7 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-bold w-6 text-center text-sm">{count}</span>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addProduct(product);
                                  }}
                                  className="h-7 w-7 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="left" className="w-64 p-3">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={product.title}
                              className="w-full h-40 object-contain rounded-lg bg-muted mb-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-2">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <p className="font-semibold text-sm">{product.title}</p>
                          {product.subtitle && (
                            <p className="text-xs text-muted-foreground">{product.subtitle}</p>
                          )}
                          <p className="font-bold text-primary mt-1">{formatPrice(product.totalPrice)}</p>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {/* Selected Products List */}
          {selectedProducts.length > 0 && (
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Itens Extras Selecionados</h3>
              <div className="space-y-2">
                {selectedProducts.map((item) => (
                  <div key={item.uniqueKey} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <span className="text-xs bg-secondary px-2 py-0.5 rounded-full mr-2">
                        {getCategoryLabel(item.category)}
                      </span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary">{formatPrice(item.price)}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeProduct(item.uniqueKey)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!activeCategory && selectedProducts.length === 0 && (
            <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma categoria</h3>
              <p className="text-muted-foreground">
                Escolha uma categoria acima para adicionar produtos extras ao seu orçamento.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
