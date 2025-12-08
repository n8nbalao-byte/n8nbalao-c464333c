import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { RedWhiteHeader } from "@/components/RedWhiteHeader";
import { RedWhiteFooter } from "@/components/RedWhiteFooter";
import { api, type Product, type HardwareItem, type CompanyData, type HardwareCategory, getCustomCategories } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { Check, Printer, ShoppingCart, ArrowLeft, Plus, X, Search, Package, ChevronRight, Cpu, Minus, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box, Droplets, Wrench, MessageCircle } from "lucide-react";
import balaoLogo from "@/assets/balao-logo-red.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Hardware steps with icons for PC assembly
const hardwareSteps: { key: HardwareCategory; label: string; required: boolean; allowMultiple: boolean; icon: React.ElementType }[] = [
  { key: 'processor', label: 'Processador', required: true, allowMultiple: false, icon: Cpu },
  { key: 'motherboard', label: 'Placa Mãe', required: true, allowMultiple: false, icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', required: true, allowMultiple: true, icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', required: true, allowMultiple: true, icon: HardDrive },
  { key: 'gpu', label: 'Placa de Vídeo', required: false, allowMultiple: false, icon: Monitor },
  { key: 'cooler', label: 'Cooler', required: false, allowMultiple: false, icon: Droplets },
  { key: 'psu', label: 'Fonte', required: true, allowMultiple: false, icon: Zap },
  { key: 'case', label: 'Gabinete', required: true, allowMultiple: false, icon: Box },
];

// Extra product categories
const defaultExtraCategories = [
  { key: 'monitor', label: 'Monitor' },
  { key: 'software', label: 'Sistema Operacional' },
  { key: 'acessorio', label: 'Acessórios' },
  { key: 'licenca', label: 'Licenças' },
  { key: 'cadeira_gamer', label: 'Cadeira Gamer' },
];

interface SelectedHardware {
  [key: string]: HardwareItem | HardwareItem[] | null;
}

interface SelectedProduct {
  id: string;
  title: string;
  price: number;
  category: string;
  uniqueKey: string;
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

type Phase = 'build' | 'quote';

export default function MonteVoceMesmo() {
  const { toast } = useToast();
  const { addToCart, setIsOpen } = useCart();
  const [phase, setPhase] = useState<Phase>('build');
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [selectedHardware, setSelectedHardware] = useState<SelectedHardware>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [extraCategories, setExtraCategories] = useState(defaultExtraCategories);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '', address: '', city: '', phone: '', email: '', cnpj: '', seller: '', logo: ''
  });
  const quoteRef = useRef<HTMLDivElement>(null);

  // Sheet states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<typeof hardwareSteps[0] | null>(null);
  const [activeExtraCategory, setActiveExtraCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Load categories from products and database
  useEffect(() => {
    async function loadCategories() {
      const customCats = await getCustomCategories();
      const excludedCategories = ['games', 'console', 'controle', 'controles'];
      
      // Get all unique categories from products
      const productCategories = products
        .map(p => p.categories?.[0] || p.productType || '')
        .filter(cat => cat && !excludedCategories.includes(cat.toLowerCase()));
      
      // Combine all categories: default + custom from DB + from products
      const allCategories = new Map<string, { key: string; label: string }>();
      
      // Add defaults
      defaultExtraCategories.forEach(cat => allCategories.set(cat.key, cat));
      
      // Add custom categories from database
      customCats.forEach(cat => allCategories.set(cat.key, { key: cat.key, label: cat.label }));
      
      // Add categories extracted from products
      productCategories.forEach(key => {
        if (!allCategories.has(key)) {
          allCategories.set(key, {
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
          });
        }
      });
      
      // Convert map to array and filter excluded
      const finalCategories = Array.from(allCategories.values())
        .filter(cat => !excludedCategories.includes(cat.key.toLowerCase()));
      
      setExtraCategories(finalCategories);
    }
    loadCategories();
  }, [products]);

  async function fetchData() {
    try {
      const [company, productsData] = await Promise.all([
        api.getCompany(),
        api.getProducts()
      ]);
      setCompanyData(company);
      setProducts(productsData.sort((a, b) => a.totalPrice - b.totalPrice));
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    }
  }

  async function openHardwareSheet(step: typeof hardwareSteps[0]) {
    setActiveStep(step);
    setActiveExtraCategory(null);
    setSearchTerm('');
    setSheetOpen(true);
    setLoading(true);

    try {
      let items = await api.getHardware(step.key);
      items = filterCompatibleHardware(items, step.key);
      setHardware(items.sort((a, b) => a.price - b.price));
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar componentes", variant: "destructive" });
    }
    setLoading(false);
  }

  function openExtraSheet(categoryKey: string) {
    setActiveExtraCategory(categoryKey);
    setActiveStep(null);
    setSearchTerm('');
    setSheetOpen(true);
  }

  function filterCompatibleHardware(items: HardwareItem[], category: HardwareCategory): HardwareItem[] {
    const processorValue = selectedHardware['processor'];
    const processor = Array.isArray(processorValue) ? processorValue[0] : processorValue;
    const motherboardValue = selectedHardware['motherboard'];
    const motherboard = Array.isArray(motherboardValue) ? motherboardValue[0] : motherboardValue;

    return items.filter(item => {
      if (category === 'motherboard' && processor?.socket && item.socket) {
        if (item.socket !== processor.socket) return false;
      }
      if (category === 'memory' && motherboard?.memoryType && item.memoryType) {
        if (item.memoryType !== motherboard.memoryType) return false;
      }
      return true;
    });
  }

  function selectHardware(item: HardwareItem) {
    if (!activeStep) return;
    
    if (activeStep.allowMultiple) {
      setSelectedHardware(prev => {
        const current = prev[activeStep.key];
        const currentArray = Array.isArray(current) ? current : current ? [current] : [];
        return { ...prev, [activeStep.key]: [...currentArray, item] };
      });
      toast({ title: "Adicionado!", description: `${item.brand} ${item.model}` });
    } else {
      setSelectedHardware(prev => ({ ...prev, [activeStep.key]: item }));
      toast({ title: "Selecionado!", description: `${item.brand} ${item.model}` });
      setSheetOpen(false);
    }
  }

  function removeOneHardwareItem(stepKey: string, itemId: string) {
    setSelectedHardware(prev => {
      const current = prev[stepKey];
      if (Array.isArray(current)) {
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

  function clearHardwareSelection(stepKey: string) {
    setSelectedHardware(prev => ({ ...prev, [stepKey]: null }));
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

  function getSelectionSummary(stepKey: string): string {
    const selection = selectedHardware[stepKey];
    if (!selection) return 'Selecione os componentes';
    if (Array.isArray(selection)) {
      if (selection.length === 0) return 'Selecione os componentes';
      if (selection.length === 1) return `${selection[0].brand} ${selection[0].model}`;
      return `${selection.length} itens selecionados`;
    }
    return `${selection.brand} ${selection.model}`;
  }

  function getExtraCategorySummary(categoryKey: string): string {
    const items = selectedProducts.filter(p => p.category === categoryKey);
    if (items.length === 0) return 'Selecione os componentes';
    if (items.length === 1) return items[0].title;
    return `${items.length} itens selecionados`;
  }

  function getCategoryLabel(key: string): string {
    const step = hardwareSteps.find(s => s.key === key);
    if (step) return step.label;
    const cat = extraCategories.find(c => c.key === key);
    return cat?.label || key;
  }

  function generateQuote() {
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

  function handleAddToCart() {
    // Add hardware items as products to cart
    hardwareSteps.forEach(step => {
      const value = selectedHardware[step.key];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            const productFromHardware: Product = {
              id: item.id,
              title: `${item.brand} ${item.model}`,
              subtitle: step.label,
              categories: ['hardware'],
              media: item.image ? [{ type: 'image' as const, url: item.image }] : [],
              specs: {},
              components: {},
              totalPrice: item.price,
              createdAt: new Date().toISOString(),
              productType: 'acessorio'
            };
            addToCart(productFromHardware);
          });
        } else {
          const productFromHardware: Product = {
            id: value.id,
            title: `${value.brand} ${value.model}`,
            subtitle: step.label,
            categories: ['hardware'],
            media: value.image ? [{ type: 'image' as const, url: value.image }] : [],
            specs: {},
            components: {},
            totalPrice: value.price,
            createdAt: new Date().toISOString(),
            productType: 'acessorio'
          };
          addToCart(productFromHardware);
        }
      }
    });

    // Add extra products to cart
    selectedProducts.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) {
        addToCart(product);
      }
    });

    setIsOpen(true);
    toast({
      title: "Itens adicionados ao carrinho!",
      description: "Todos os componentes do orçamento foram adicionados.",
    });
  }

  function handleSendWhatsApp() {
    const emissionDate = new Date();
    const validityDate = new Date(emissionDate);
    validityDate.setDate(validityDate.getDate() + 7);

    let message = `*ORÇAMENTO - ${companyData.name || 'Loja'}*\n`;
    message += `Data: ${formatDate(emissionDate)}\n`;
    message += `Validade: ${formatDate(validityDate)}\n\n`;
    
    const hasHardware = Object.values(selectedHardware).some(v => v);
    if (hasHardware) {
      message += `*MONTAGEM DE PC*\n`;
      hardwareSteps.forEach(step => {
        const value = selectedHardware[step.key];
        if (value) {
          if (Array.isArray(value)) {
            const grouped = value.reduce((acc, item) => {
              acc[item.id] = acc[item.id] || { item, count: 0 };
              acc[item.id].count++;
              return acc;
            }, {} as Record<string, { item: HardwareItem; count: number }>);
            Object.values(grouped).forEach(({ item, count }) => {
              message += `• ${step.label}: ${count > 1 ? `${count}x ` : ''}${item.brand} ${item.model} - ${formatPrice(item.price * count)}\n`;
            });
          } else {
            message += `• ${step.label}: ${value.brand} ${value.model} - ${formatPrice(value.price)}\n`;
          }
        }
      });
      message += `Subtotal PC: ${formatPrice(calculateHardwareTotal())}\n\n`;
    }

    if (selectedProducts.length > 0) {
      message += `*ITENS EXTRAS*\n`;
      selectedProducts.forEach(item => {
        message += `• ${item.title} - ${formatPrice(item.price)}\n`;
      });
      message += `Subtotal Extras: ${formatPrice(calculateProductsTotal())}\n\n`;
    }

    message += `*TOTAL: ${formatPrice(calculateTotal())}*`;

    const phone = companyData.phone?.replace(/\D/g, '') || '';
    if (!phone) {
      toast({
        title: "Telefone não configurado",
        description: "Configure o telefone da empresa no painel administrativo.",
        variant: "destructive"
      });
      return;
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Filtered hardware for sheet
  const filteredHardware = hardware.filter(item =>
    !searchTerm || 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered products for sheet
  const filteredProducts = products.filter(product => {
    const productCategory = product.categories?.[0] || product.productType || '';
    const matchesCategory = productCategory === activeExtraCategory;
    const matchesSearch = !searchTerm || 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const emissionDate = new Date();
  const validityDate = new Date(emissionDate);
  validityDate.setDate(validityDate.getDate() + 7);

  // PHASE: Quote Display
  if (phase === 'quote') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <header className="bg-white py-4 shadow-md">
          <div className="container flex items-center justify-between">
            <Link to="/"><img src={balaoLogo} alt="Balão da Informática" className="h-12" /></Link>
            <Button variant="ghost" onClick={() => setPhase('build')} className="text-primary hover:bg-primary/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </header>

        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-end gap-2 mb-6 flex-wrap">
              <Button variant="outline" onClick={printQuote} className="bg-white hover:bg-gray-50">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button onClick={handleAddToCart} className="bg-primary hover:bg-primary/90 text-white">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Adicionar ao Carrinho
              </Button>
              <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8" ref={quoteRef}>
              <div className="quote-container">
                <div className="header text-center border-b-4 border-primary pb-6 mb-8">
                  {companyData.logo && (
                    <img src={companyData.logo} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
                  )}
                  <div className="text-3xl font-bold text-primary mb-2">
                    {companyData.name || 'Empresa'}
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    {(companyData.address || companyData.city) && (
                      <p>{companyData.address}{companyData.address && companyData.city && ' - '}{companyData.city}</p>
                    )}
                    {(companyData.phone || companyData.email) && (
                      <p>{companyData.phone && `Tel: ${companyData.phone}`}{companyData.phone && companyData.email && ' | '}{companyData.email && `Email: ${companyData.email}`}</p>
                    )}
                    {companyData.cnpj && <p>CNPJ: {companyData.cnpj}</p>}
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">ORÇAMENTO</h2>
                <div className="text-right text-sm text-gray-500 mb-6">
                  Data de Emissão: {formatDate(emissionDate)}
                </div>

                {Object.values(selectedHardware).some(v => v) && (
                  <>
                    <h3 className="text-lg font-bold border-b-2 border-gray-200 pb-2 mb-4 text-gray-800">
                      Montagem de PC
                    </h3>
                    <table className="w-full border-collapse mb-6">
                      <thead>
                        <tr>
                          <th className="bg-primary text-white p-3 text-left">Componente</th>
                          <th className="bg-primary text-white p-3 text-left">Descrição</th>
                          <th className="bg-primary text-white p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hardwareSteps.map((step) => {
                          const item = selectedHardware[step.key];
                          if (!item) return null;
                          
                          if (Array.isArray(item)) {
                            return item.map((h, idx) => (
                              <tr key={`${step.key}-${idx}`} className="border-b border-gray-200">
                                <td className="p-3 font-medium text-gray-700">{step.label} {item.length > 1 ? `#${idx + 1}` : ''}</td>
                                <td className="p-3 text-gray-600">{h.brand} {h.model}</td>
                                <td className="p-3 text-right text-gray-800">{formatPrice(h.price)}</td>
                              </tr>
                            ));
                          }
                          
                          return (
                            <tr key={step.key} className="border-b border-gray-200">
                              <td className="p-3 font-medium text-gray-700">{step.label}</td>
                              <td className="p-3 text-gray-600">{item.brand} {item.model}</td>
                              <td className="p-3 text-right text-gray-800">{formatPrice(item.price)}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-primary/10 font-bold">
                          <td className="p-3 text-gray-800" colSpan={2}>Subtotal PC</td>
                          <td className="p-3 text-right text-primary">{formatPrice(calculateHardwareTotal())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {selectedProducts.length > 0 && (
                  <>
                    <h3 className="text-lg font-bold border-b-2 border-gray-200 pb-2 mb-4 text-gray-800">
                      Itens Adicionais
                    </h3>
                    <table className="w-full border-collapse mb-6">
                      <thead>
                        <tr>
                          <th className="bg-primary text-white p-3 text-left">Categoria</th>
                          <th className="bg-primary text-white p-3 text-left">Produto</th>
                          <th className="bg-primary text-white p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProducts.map((item) => (
                          <tr key={item.uniqueKey} className="border-b border-gray-200">
                            <td className="p-3 font-medium text-gray-700">{getCategoryLabel(item.category)}</td>
                            <td className="p-3 text-gray-600">{item.title}</td>
                            <td className="p-3 text-right text-gray-800">{formatPrice(item.price)}</td>
                          </tr>
                        ))}
                        <tr className="bg-primary/10 font-bold">
                          <td className="p-3 text-gray-800" colSpan={2}>Subtotal Adicionais</td>
                          <td className="p-3 text-right text-primary">{formatPrice(calculateProductsTotal())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                <table className="w-full border-collapse mb-6">
                  <tbody>
                    <tr className="bg-gray-900 text-white font-bold text-xl">
                      <td className="p-4">TOTAL GERAL</td>
                      <td className="p-4 text-right">{formatPrice(calculateTotal())}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg text-center mb-8">
                  <p className="text-yellow-800">
                    <strong>⚠️ Validade:</strong> {formatDate(validityDate)} (7 dias)
                  </p>
                </div>

                <div className="text-center pt-6 border-t border-gray-200">
                  <p className="text-lg font-bold text-primary mb-2">Obrigado pela preferência!</p>
                  <p className="text-sm text-gray-500">Para confirmar seu pedido, entre em contato conosco.</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-6">
          <div className="container text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Balão da Informática. Todos os direitos reservados.
          </div>
        </footer>
      </div>
    );
  }

  // PHASE: Build
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white py-4 shadow-md">
        <div className="container flex items-center justify-between">
          <Link to="/"><img src={balaoLogo} alt="Balão da Informática" className="h-12" /></Link>
          <Link to="/loja" className="text-primary hover:underline font-medium">Ver Loja</Link>
        </div>
      </header>
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-primary text-white">
                <Wrench className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">MONTE SEU PC</h1>
            <p className="text-gray-600">Escolha cada componente e monte o computador perfeito para você!</p>
          </div>

          {/* Component List */}
          <div className="space-y-3 mb-8">
            {/* Hardware Components */}
            {hardwareSteps.map((step) => {
              const selection = selectedHardware[step.key];
              const isSelected = Array.isArray(selection) ? selection.length > 0 : !!selection;
              const Icon = step.icon;
              
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all bg-white ${
                    isSelected 
                      ? 'border-green-500' 
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  {/* Icon Column */}
                  <div className={`flex flex-col items-center justify-center w-24 p-3 rounded-lg ${
                    isSelected ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-6 w-6 mb-1 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="text-xs font-medium text-center text-gray-700">{step.label}</span>
                    {step.required && !isSelected && (
                      <span className="text-[10px] text-primary font-medium">*Obrigatório</span>
                    )}
                  </div>
                  
                  {/* Selection Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                      {getSelectionSummary(step.key)}
                    </p>
                    {isSelected && (
                      <p className="text-sm text-primary font-bold">
                        {Array.isArray(selection) 
                          ? formatPrice(selection.reduce((s, h) => s + h.price, 0))
                          : formatPrice(selection?.price || 0)
                        }
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearHardwareSelection(step.key)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      className={isSelected ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-primary hover:bg-primary/90 text-white"}
                      onClick={() => openHardwareSheet(step)}
                    >
                      {isSelected ? 'Alterar' : 'Selecionar'}
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Divider */}
            <div className="py-4 flex items-center">
              <div className="flex-1 border-t border-gray-300" />
              <span className="px-4 text-sm text-gray-500 bg-gray-100">Itens Opcionais</span>
              <div className="flex-1 border-t border-gray-300" />
            </div>

            {/* Extra Products */}
            {extraCategories.map((cat) => {
              const catProducts = products.filter(p => 
                (p.categories?.[0] || p.productType) === cat.key
              );
              if (catProducts.length === 0) return null;
              
              const selectedInCat = selectedProducts.filter(p => p.category === cat.key);
              const isSelected = selectedInCat.length > 0;
              
              return (
                <div
                  key={cat.key}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all bg-white ${
                    isSelected 
                      ? 'border-green-500' 
                      : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  {/* Icon Column */}
                  <div className={`flex flex-col items-center justify-center w-24 p-3 rounded-lg ${
                    isSelected ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Package className={`h-6 w-6 mb-1 ${isSelected ? 'text-green-600' : 'text-gray-500'}`} />
                    <span className="text-xs font-medium text-center text-gray-700">{cat.label}</span>
                  </div>
                  
                  {/* Selection Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isSelected ? 'text-gray-800' : 'text-gray-400'}`}>
                      {getExtraCategorySummary(cat.key)}
                    </p>
                    {isSelected && (
                      <p className="text-sm text-primary font-bold">
                        {formatPrice(selectedInCat.reduce((s, p) => s + p.price, 0))}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      className={isSelected ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-white border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary"}
                      onClick={() => openExtraSheet(cat.key)}
                    >
                      {isSelected ? 'Alterar' : 'Selecionar'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price Summary - Sticky Bottom */}
          <div className="sticky bottom-4 bg-white border-2 border-primary rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="text-3xl font-bold text-primary">{formatPrice(calculateTotal())}</p>
              </div>
              <Button 
                size="lg" 
                onClick={generateQuote}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Gerar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 mt-8">
        <div className="container text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Balão da Informática. Todos os direitos reservados.
        </div>
      </footer>

      {/* Selection Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="text-gray-800">
              {activeStep ? activeStep.label : getCategoryLabel(activeExtraCategory || '')}
            </SheetTitle>
          </SheetHeader>

          {/* Search */}
          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-300 text-gray-800"
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activeStep ? (
            /* Hardware Items */
            <div className="space-y-2">
              {filteredHardware.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum componente encontrado</p>
                </div>
              ) : filteredHardware.map((item) => {
                const count = getItemCount(activeStep.key, item.id);
                const isSelected = count > 0;
                
                return (
                  <TooltipProvider key={item.id}>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer bg-white ${
                            isSelected 
                              ? 'border-green-500' 
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800">{item.brand} {item.model}</p>
                                <p className="text-sm text-gray-500 truncate">{item.name}</p>
                                <p className="text-lg font-bold text-primary mt-1">{formatPrice(item.price)}</p>
                              </div>
                            </div>
                            
                            {activeStep.allowMultiple ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="border-gray-300"
                                  onClick={(e) => { e.stopPropagation(); removeOneHardwareItem(activeStep.key, item.id); }}
                                  disabled={count === 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-bold w-8 text-center text-gray-800">{count}</span>
                                <Button
                                  size="icon"
                                  className="bg-primary hover:bg-primary/90"
                                  onClick={(e) => { e.stopPropagation(); selectHardware(item); }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                className={isSelected ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/90 text-white"}
                                onClick={(e) => { e.stopPropagation(); selectHardware(item); }}
                              >
                                {isSelected ? <Check className="h-4 w-4 mr-1" /> : null}
                                {isSelected ? 'Selecionado' : 'Selecionar'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="w-48 p-2 bg-white border border-gray-200">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={`${item.brand} ${item.model}`}
                            className="w-full h-32 object-contain rounded-lg bg-gray-100"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <p className="font-semibold text-sm mt-2 text-center text-gray-800">{item.brand} {item.model}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              
              {activeStep.allowMultiple && (
                <Button 
                  className="w-full mt-4 bg-primary hover:bg-primary/90" 
                  onClick={() => setSheetOpen(false)}
                >
                  Confirmar Seleção
                </Button>
              )}
            </div>
          ) : activeExtraCategory ? (
            /* Product Items */
            <div className="space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p>Nenhum produto encontrado</p>
                </div>
              ) : filteredProducts.map((product) => {
                const count = getProductCount(product.id);
                const isSelected = count > 0;
                
                const productImage = product.media?.[0]?.url;
                return (
                  <TooltipProvider key={product.id}>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer bg-white ${
                            isSelected 
                              ? 'border-green-500' 
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                {productImage ? (
                                  <img 
                                    src={productImage} 
                                    alt={product.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800">{product.title}</p>
                                {product.subtitle && (
                                  <p className="text-sm text-gray-500 truncate">{product.subtitle}</p>
                                )}
                                <p className="text-lg font-bold text-primary mt-1">{formatPrice(product.totalPrice)}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-gray-300"
                                onClick={(e) => { e.stopPropagation(); removeOneProduct(product.id); }}
                                disabled={count === 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-bold w-8 text-center text-gray-800">{count}</span>
                              <Button
                                size="icon"
                                className="bg-primary hover:bg-primary/90"
                                onClick={(e) => { e.stopPropagation(); addProduct(product); }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="w-48 p-2 bg-white border border-gray-200">
                        {productImage ? (
                          <img 
                            src={productImage} 
                            alt={product.title}
                            className="w-full h-32 object-contain rounded-lg bg-gray-100"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <p className="font-semibold text-sm mt-2 text-center text-gray-800">{product.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
              
              <Button 
                className="w-full mt-4 bg-primary hover:bg-primary/90" 
                onClick={() => setSheetOpen(false)}
              >
                Confirmar Seleção
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
