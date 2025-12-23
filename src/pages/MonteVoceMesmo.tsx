import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
// Mantenha seus imports de componentes existentes
import {
  api,
  type Product,
  type HardwareItem,
  type CompanyData,
  type HardwareCategory,
  getCustomCategories,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Check,
  Printer,
  ShoppingCart,
  ArrowLeft,
  Plus,
  Minus,
  X,
  Search,
  Package,
  ChevronRight,
  Cpu,
  CircuitBoard,
  MemoryStick,
  HardDrive,
  Monitor,
  Zap,
  Box,
  Droplets,
  Wrench,
  MessageCircle,
  Building2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge"; // Importante se tiver, senão use div com classes
import { Progress } from "@/components/ui/progress"; // Importante para a barra de progresso
import { Separator } from "@/components/ui/separator";

// Hardware steps with icons for PC assembly
const hardwareSteps: {
  key: HardwareCategory;
  label: string;
  required: boolean;
  allowMultiple: boolean;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    key: "processor",
    label: "Processador",
    required: true,
    allowMultiple: false,
    icon: Cpu,
    description: "O cérebro do computador.",
  },
  {
    key: "motherboard",
    label: "Placa Mãe",
    required: true,
    allowMultiple: false,
    icon: CircuitBoard,
    description: "Conecta todos os componentes.",
  },
  {
    key: "memory",
    label: "Memória RAM",
    required: true,
    allowMultiple: true,
    icon: MemoryStick,
    description: "Agilidade para multitarefas.",
  },
  {
    key: "storage",
    label: "Armazenamento",
    required: true,
    allowMultiple: true,
    icon: HardDrive,
    description: "Espaço para seus arquivos.",
  },
  {
    key: "gpu",
    label: "Placa de Vídeo",
    required: false,
    allowMultiple: false,
    icon: Monitor,
    description: "Essencial para jogos e renderização.",
  },
  {
    key: "cooler",
    label: "Cooler",
    required: false,
    allowMultiple: false,
    icon: Droplets,
    description: "Mantém a temperatura ideal.",
  },
  {
    key: "psu",
    label: "Fonte",
    required: true,
    allowMultiple: false,
    icon: Zap,
    description: "Energia para todo o sistema.",
  },
  {
    key: "case",
    label: "Gabinete",
    required: true,
    allowMultiple: false,
    icon: Box,
    description: "A estrutura do seu PC.",
  },
];

const defaultExtraCategories = [
  { key: "monitor", label: "Monitor" },
  { key: "software", label: "Sistema Operacional" },
  { key: "acessorio", label: "Acessórios" },
  { key: "licenca", label: "Licenças" },
  { key: "cadeira_gamer", label: "Cadeira Gamer" },
];

// ... (Mantenha as interfaces SelectedHardware, SelectedProduct, formatPrice, formatDate aqui)
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
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

type Phase = "build" | "quote";

export default function MonteVoceMesmo() {
  const { toast } = useToast();
  const { addToCart, setIsOpen } = useCart();
  const { company } = useCompany();
  const [phase, setPhase] = useState<Phase>("build");
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [selectedHardware, setSelectedHardware] = useState<SelectedHardware>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [extraCategories, setExtraCategories] = useState(defaultExtraCategories);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    cnpj: "",
    seller: "",
    logo: "",
  });
  const quoteRef = useRef<HTMLDivElement>(null);

  // Sheet states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<(typeof hardwareSteps)[0] | null>(null);
  const [activeExtraCategory, setActiveExtraCategory] = useState<string | null>(null);

  // ... (Mantenha seus useEffects de loadCategories e fetchData aqui - SEM ALTERAÇÕES NA LÓGICA)
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    async function loadCategories() {
      const customCats = await getCustomCategories();
      const excludedCategories = ["games", "console", "controle", "controles"];

      const productCategories = products
        .map((p) => p.categories?.[0] || p.productType || "")
        .filter((cat) => cat && !excludedCategories.includes(cat.toLowerCase()));

      const allCategories = new Map<string, { key: string; label: string }>();
      defaultExtraCategories.forEach((cat) => allCategories.set(cat.key, cat));
      customCats.forEach((cat) => allCategories.set(cat.key, { key: cat.key, label: cat.label }));
      productCategories.forEach((key) => {
        if (!allCategories.has(key)) {
          allCategories.set(key, {
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
          });
        }
      });
      const finalCategories = Array.from(allCategories.values()).filter(
        (cat) => !excludedCategories.includes(cat.key.toLowerCase()),
      );
      setExtraCategories(finalCategories);
    }
    loadCategories();
  }, [products]);

  async function fetchData() {
    try {
      const [company, productsData] = await Promise.all([api.getCompany(), api.getProducts()]);
      setCompanyData(company);
      setProducts(productsData.sort((a, b) => a.totalPrice - b.totalPrice));
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    }
  }

  // ... (Mantenha as funções de lógica: openHardwareSheet, filterCompatibleHardware, selectHardware, etc.)
  async function openHardwareSheet(step: (typeof hardwareSteps)[0]) {
    setActiveStep(step);
    setActiveExtraCategory(null);
    setSearchTerm("");
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
    setSearchTerm("");
    setSheetOpen(true);
  }

  // NOTE: Copiei a lógica exata do seu código original para garantir funcionamento
  function filterCompatibleHardware(items: HardwareItem[], category: HardwareCategory): HardwareItem[] {
    const processorValue = selectedHardware["processor"];
    const processor = Array.isArray(processorValue) ? processorValue[0] : processorValue;
    const motherboardValue = selectedHardware["motherboard"];
    const motherboard = Array.isArray(motherboardValue) ? motherboardValue[0] : motherboardValue;
    const gpuValue = selectedHardware["gpu"];
    const gpu = Array.isArray(gpuValue) ? gpuValue[0] : gpuValue;
    const caseValue = selectedHardware["case"];
    const selectedCase = Array.isArray(caseValue) ? caseValue[0] : caseValue;

    return items.filter((item) => {
      if (category === "motherboard" && processor?.socket && item.socket) {
        if (item.socket !== processor.socket) return false;
      }
      if (category === "memory" && motherboard?.memoryType && item.memoryType) {
        if (item.memoryType !== motherboard.memoryType) return false;
      }
      if (category === "cooler" && processor?.socket && item.socket) {
        if (item.socket !== "Universal" && item.socket !== processor.socket) return false;
      }
      if (category === "cooler" && selectedCase?.formFactor && item.formFactor) {
        const caseToMaxRadiator: Record<string, string[]> = {
          "Mini-ITX": ["120mm", "140mm", "Air Cooler"],
          "Micro-ATX": ["120mm", "140mm", "240mm", "Air Cooler"],
          ATX: ["120mm", "140mm", "240mm", "280mm", "360mm", "Air Cooler"],
          "Full Tower": ["120mm", "140mm", "240mm", "280mm", "360mm", "420mm", "Air Cooler"],
          "E-ATX": ["120mm", "140mm", "240mm", "280mm", "360mm", "420mm", "Air Cooler"],
        };
        const allowedSizes = caseToMaxRadiator[selectedCase.formFactor] || [];
        if (allowedSizes.length > 0 && item.formFactor && !allowedSizes.includes(item.formFactor)) {
          return false;
        }
      }
      if (category === "psu" && gpu?.tdp && item.tdp) {
        const requiredWattage = gpu.tdp + 250;
        if (item.tdp < requiredWattage) return false;
      }
      if (category === "case" && motherboard?.formFactor && item.formFactor) {
        const caseToMotherboard: Record<string, string[]> = {
          "Mini-ITX": ["Mini-ITX"],
          "Micro-ATX": ["Mini-ITX", "Micro-ATX"],
          ATX: ["Mini-ITX", "Micro-ATX", "ATX"],
          "Full Tower": ["Mini-ITX", "Micro-ATX", "ATX", "E-ATX"],
          "E-ATX": ["Mini-ITX", "Micro-ATX", "ATX", "E-ATX"],
        };
        const supportedMobo = caseToMotherboard[item.formFactor] || [];
        if (supportedMobo.length > 0 && !supportedMobo.includes(motherboard.formFactor)) {
          return false;
        }
      }
      return true;
    });
  }

  function selectHardware(item: HardwareItem) {
    if (!activeStep) return;

    if (activeStep.allowMultiple) {
      setSelectedHardware((prev) => {
        const current = prev[activeStep.key];
        const currentArray = Array.isArray(current) ? current : current ? [current] : [];
        return { ...prev, [activeStep.key]: [...currentArray, item] };
      });
      toast({ title: "Adicionado!", description: `${item.brand} ${item.model}` });
    } else {
      setSelectedHardware((prev) => ({ ...prev, [activeStep.key]: item }));
      toast({ title: "Selecionado!", description: `${item.brand} ${item.model}` });
      setSheetOpen(false);
    }
  }

  function removeOneHardwareItem(stepKey: string, itemId: string) {
    setSelectedHardware((prev) => {
      const current = prev[stepKey];
      if (Array.isArray(current)) {
        const idx = current.findIndex((h) => h.id === itemId);
        if (idx >= 0) {
          const newArray = [...current];
          newArray.splice(idx, 1);
          return { ...prev, [stepKey]: newArray.length > 0 ? newArray : null };
        }
      }
      return { ...prev, [stepKey]: null };
    });
  }

  function clearHardwareSelection(stepKey: string) {
    setSelectedHardware((prev) => ({ ...prev, [stepKey]: null }));
  }

  function addProduct(product: Product) {
    setSelectedProducts((prev) => [
      ...prev,
      {
        id: product.id,
        title: product.title,
        price: product.totalPrice,
        category: product.categories?.[0] || product.productType || "outro",
        uniqueKey: `${product.id}-${Date.now()}-${Math.random()}`,
      },
    ]);
    toast({ title: "Adicionado!", description: product.title });
  }

  function getProductCount(productId: string) {
    return selectedProducts.filter((p) => p.id === productId).length;
  }

  function removeOneProduct(productId: string) {
    setSelectedProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === productId);
      if (idx < 0) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }

  function removeProduct(uniqueKey: string) {
    setSelectedProducts((prev) => prev.filter((p) => p.uniqueKey !== uniqueKey));
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

  // NEW: Calculate Progress for the Progress Bar
  function calculateProgress(): number {
    const requiredSteps = hardwareSteps.filter((s) => s.required);
    const filledSteps = requiredSteps.filter((step) => {
      const val = selectedHardware[step.key];
      if (Array.isArray(val)) return val.length > 0;
      return val !== null && val !== undefined;
    });
    return (filledSteps.length / requiredSteps.length) * 100;
  }

  function getCategoryLabel(key: string): string {
    const step = hardwareSteps.find((s) => s.key === key);
    if (step) return step.label;
    const cat = extraCategories.find((c) => c.key === key);
    return cat?.label || key;
  }

  function generateQuote() {
    const missing = hardwareSteps.filter((step) => {
      const value = selectedHardware[step.key];
      if (!step.required) return false;
      if (Array.isArray(value)) return value.length === 0;
      return !value;
    });

    if (missing.length > 0) {
      toast({
        title: "Falta pouco!",
        description: `Selecione: ${missing.map((s) => s.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    setPhase("quote");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ... (Mantenha printQuote, handleAddToCart, handleSendWhatsApp igual)
  function printQuote() {
    const printContent = quoteRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orçamento - ${companyData.name || "Orçamento"}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .quote-container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .components-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .components-table th { background: #3b82f6; color: white; padding: 12px; text-align: left; }
            .components-table td { padding: 12px; border-bottom: 1px solid #ddd; }
            .total-row { background: #e0f2fe !important; font-weight: bold; font-size: 18px; }
            /* Simplified CSS for printing */
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
    hardwareSteps.forEach((step) => {
      const value = selectedHardware[step.key];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            const product: Product = {
              id: item.id,
              title: `${item.brand} ${item.model}`,
              subtitle: step.label,
              categories: ["hardware"],
              media: item.image ? [{ type: "image", url: item.image }] : [],
              specs: {},
              components: {},
              totalPrice: item.price,
              createdAt: new Date().toISOString(),
              productType: "acessorio",
            };
            addToCart(product);
          });
        } else {
          const product: Product = {
            id: value.id,
            title: `${value.brand} ${value.model}`,
            subtitle: step.label,
            categories: ["hardware"],
            media: value.image ? [{ type: "image", url: value.image }] : [],
            specs: {},
            components: {},
            totalPrice: value.price,
            createdAt: new Date().toISOString(),
            productType: "acessorio",
          };
          addToCart(product);
        }
      }
    });
    selectedProducts.forEach((item) => {
      const product = products.find((p) => p.id === item.id);
      if (product) addToCart(product);
    });
    setIsOpen(true);
    toast({ title: "Sucesso!", description: "Tudo adicionado ao carrinho." });
  }

  function handleSendWhatsApp() {
    const emissionDate = new Date();
    const validityDate = new Date(emissionDate);
    validityDate.setDate(validityDate.getDate() + 7);
    let message = `*ORÇAMENTO - ${companyData.name || "Loja"}*\nData: ${formatDate(emissionDate)}\n\n`;

    if (Object.values(selectedHardware).some((v) => v)) {
      message += `*MEU PC GAMER*\n`;
      hardwareSteps.forEach((step) => {
        const value = selectedHardware[step.key];
        if (value) {
          if (Array.isArray(value)) {
            value.forEach((v) => {
              message += `• ${step.label}: ${v.brand} ${v.model} - ${formatPrice(v.price)}\n`;
            });
          } else {
            message += `• ${step.label}: ${value.brand} ${value.model} - ${formatPrice(value.price)}\n`;
          }
        }
      });
    }
    if (selectedProducts.length > 0) {
      message += `\n*EXTRAS*\n`;
      selectedProducts.forEach((item) => {
        message += `• ${item.title} - ${formatPrice(item.price)}\n`;
      });
    }
    message += `\n*TOTAL: ${formatPrice(calculateTotal())}*`;
    const phone = companyData.phone?.replace(/\D/g, "") || "";
    if (!phone)
      return toast({ title: "Erro", description: "Telefone da loja não configurado", variant: "destructive" });
    window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(message)}`, "_blank");
  }

  // Filtered logic for sheet
  const filteredHardware = hardware.filter(
    (item) =>
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredProducts = products.filter((product) => {
    const productCategory = product.categories?.[0] || product.productType || "";
    const matchesCategory = productCategory === activeExtraCategory;
    const matchesSearch =
      !searchTerm ||
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const emissionDate = new Date();
  const validityDate = new Date(emissionDate);
  validityDate.setDate(validityDate.getDate() + 7);

  // --- RENDER START ---

  if (phase === "quote") {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setPhase("build")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-bold text-lg hidden md:block">Resumo do Orçamento</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={printQuote}>
                <Printer className="h-4 w-4 mr-2" /> Imprimir
              </Button>
              <Button size="sm" onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="h-4 w-4 mr-2" /> Zap
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container py-8">
          <div
            className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
            ref={quoteRef}
          >
            {/* Cabeçalho do Orçamento - Visual de Papel */}
            <div className="bg-slate-900 text-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  {companyData.logo ? (
                    <img src={companyData.logo} alt="Logo" className="h-16 object-contain bg-white rounded p-1 mb-4" />
                  ) : (
                    <h2 className="text-3xl font-bold tracking-tight">{companyData.name || "Sua Loja"}</h2>
                  )}
                  <div className="text-slate-300 text-sm space-y-1 mt-2">
                    <p>
                      {companyData.address} {companyData.city}
                    </p>
                    <p>
                      {companyData.phone} | {companyData.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Valor Total</div>
                  <div className="text-4xl font-bold text-primary-foreground">{formatPrice(calculateTotal())}</div>
                  <div className="text-sm text-slate-400 mt-1">Válido até {formatDate(validityDate)}</div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Lista de Hardware */}
              {Object.values(selectedHardware).some((v) => v) && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Cpu className="h-4 w-4" /> Configuração do PC
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    {hardwareSteps.map((step, idx) => {
                      const value = selectedHardware[step.key];
                      if (!value) return null;
                      const items = Array.isArray(value) ? value : [value];
                      if (items.length === 0) return null;

                      return items.map((item, i) => (
                        <div
                          key={`${step.key}-${i}`}
                          className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                              <step.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-xs text-primary font-medium">{step.label}</div>
                              <div className="font-medium text-slate-900">
                                {item.brand} {item.model}
                              </div>
                            </div>
                          </div>
                          <div className="font-semibold text-slate-700">{formatPrice(item.price)}</div>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              )}

              {/* Lista de Extras */}
              {selectedProducts.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4" /> Itens Adicionais
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    {selectedProducts.map((item, i) => (
                      <div
                        key={item.uniqueKey}
                        className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-slate-50"
                      >
                        <div>
                          <div className="text-xs text-primary font-medium">{getCategoryLabel(item.category)}</div>
                          <div className="font-medium text-slate-900">{item.title}</div>
                        </div>
                        <div className="font-semibold text-slate-700">{formatPrice(item.price)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm border border-yellow-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>
                  Os preços podem sofrer alterações sem aviso prévio. A disponibilidade dos itens é garantida apenas
                  mediante confirmação do pedido.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-t">
              <Button variant="outline" className="w-full md:w-auto" onClick={() => setPhase("build")}>
                Editar Orçamento
              </Button>
              <Button size="lg" className="w-full md:w-auto shadow-lg shadow-primary/25" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" /> Finalizar Pedido
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- PHASE: BUILD ---
  const progress = calculateProgress();
  const total = calculateTotal();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar Minimalista */}
      <nav className="bg-white border-b sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="container h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {company?.logo ? (
              <img src={company.logo} alt="Logo" className="h-8 object-contain" />
            ) : (
              <div className="bg-primary text-white p-1.5 rounded">
                <Building2 className="h-5 w-5" />
              </div>
            )}
            <span className="font-bold text-lg tracking-tight text-slate-800 hidden sm:block">Monte Seu PC</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/loja" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              Loja Completa
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">Total Estimado</span>
              <span className="text-sm font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
        {/* Progress Bar integrado na navbar */}
        <Progress value={progress} className="h-1 w-full rounded-none bg-slate-100" />
      </nav>

      <main className="flex-1 container py-8 pb-32">
        {" "}
        {/* pb-32 para dar espaço ao footer fixo */}
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Vamos montar sua máquina.
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              Escolha componente por componente. Nós garantimos a compatibilidade das peças principais.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal: Componentes */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  variant="outline"
                  className="bg-white px-3 py-1 text-sm border-primary/20 text-primary shadow-sm"
                >
                  Hardware Principal
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {hardwareSteps.map((step) => {
                  const selection = selectedHardware[step.key];
                  const hasSelection = Array.isArray(selection) ? selection.length > 0 : !!selection;
                  const StepIcon = step.icon;

                  return (
                    <Card
                      key={step.key}
                      className={`
                            relative overflow-hidden transition-all duration-300 border-2 cursor-pointer group
                            ${hasSelection ? "border-primary/50 bg-white shadow-md shadow-primary/5" : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-md"}
                        `}
                      onClick={() => openHardwareSheet(step)}
                    >
                      <div className="p-5 flex items-start sm:items-center gap-5">
                        <div
                          className={`
                                h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors
                                ${hasSelection ? "bg-primary text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"}
                            `}
                        >
                          <StepIcon className="h-7 w-7" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-bold text-lg ${hasSelection ? "text-primary" : "text-slate-700"}`}>
                              {step.label}
                            </h3>
                            {step.required && !hasSelection && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                                Obrigatório
                              </span>
                            )}
                            {hasSelection && <Check className="h-4 w-4 text-green-500" />}
                          </div>

                          {hasSelection ? (
                            <div className="mt-1">
                              {Array.isArray(selection) ? (
                                <div className="space-y-1">
                                  {selection.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between items-center text-sm bg-slate-50 p-1.5 rounded px-2"
                                    >
                                      <span className="truncate font-medium text-slate-700">
                                        {item.brand} {item.model}
                                      </span>
                                      <span className="text-slate-500 ml-2 text-xs">{formatPrice(item.price)}</span>
                                    </div>
                                  ))}
                                  <div className="text-xs text-primary font-medium mt-1 cursor-pointer hover:underline">
                                    {step.allowMultiple ? "+ Adicionar mais" : "Clique para trocar"}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-1">
                                  <p className="text-sm font-medium text-slate-800 truncate pr-2">
                                    {selection?.brand} {selection?.model}
                                  </p>
                                  <p className="text-sm font-bold text-slate-600">
                                    {formatPrice(selection?.price || 0)}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 mt-1 line-clamp-1">{step.description}</p>
                          )}
                        </div>

                        <div className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 text-slate-300 group-hover:border-primary group-hover:text-primary transition-all">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>

                      {/* Botão de limpar sutil se selecionado */}
                      {hasSelection && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearHardwareSelection(step.key);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>

              {/* Seção de Extras */}
              <div className="pt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant="outline"
                    className="bg-white px-3 py-1 text-sm border-purple-200 text-purple-600 shadow-sm"
                  >
                    Periféricos & Extras
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {extraCategories.map((cat) => {
                    const items = selectedProducts.filter((p) => p.category === cat.key);
                    const count = items.length;
                    return (
                      <div
                        key={cat.key}
                        onClick={() => openExtraSheet(cat.key)}
                        className={`
                                    border rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-1
                                    ${count > 0 ? "bg-purple-50 border-purple-200" : "bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg"}
                                `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-sm font-bold ${count > 0 ? "text-purple-700" : "text-slate-600"}`}>
                            {cat.label}
                          </span>
                          {count > 0 && (
                            <Badge className="bg-purple-600 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                              {count}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {count > 0 ? `${formatPrice(items.reduce((a, b) => a + b.price, 0))}` : "Adicionar"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Coluna Lateral: Resumo Flutuante (Desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-slate-100 p-6">
                <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Resumo
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      Hardware ({Object.values(selectedHardware).flat().filter(Boolean).length})
                    </span>
                    <span className="font-medium">{formatPrice(calculateHardwareTotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Extras ({selectedProducts.length})</span>
                    <span className="font-medium">{formatPrice(calculateProductsTotal())}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-slate-800">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-black text-primary">{formatPrice(total)}</div>
                      <div className="text-xs text-slate-400">até 10x sem juros</div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full text-lg h-12 shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]"
                  onClick={generateQuote}
                >
                  Gerar Orçamento
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Fixo Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-30">
        <div className="container flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-500">Total Estimado</div>
            <div className="text-xl font-black text-primary leading-tight">{formatPrice(total)}</div>
          </div>
          <Button className="flex-1 h-12 text-base shadow-lg shadow-primary/25" onClick={generateQuote}>
            Ver Resumo <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>

      {/* Sheet de Seleção de Produtos */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col bg-slate-50">
          <SheetHeader className="p-6 bg-white border-b">
            <SheetTitle className="flex items-center gap-2 text-xl">
              {activeStep ? (
                <>
                  <activeStep.icon className="h-5 w-5 text-primary" /> {activeStep.label}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-purple-600" />{" "}
                  {activeExtraCategory ? getCategoryLabel(activeExtraCategory) : "Adicionar"}
                </>
              )}
            </SheetTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar marca, modelo..."
                className="pl-9 bg-slate-100 border-none focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : activeStep ? (
              // Lista de Hardware no Sheet
              filteredHardware.length > 0 ? (
                filteredHardware.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex gap-4 hover:border-primary/50 transition-all group"
                  >
                    <div className="h-20 w-20 bg-white border rounded-lg shrink-0 flex items-center justify-center p-2">
                      {item.image ? (
                        <img src={item.image} alt={item.model} className="max-full max-h-full object-contain" />
                      ) : (
                        <activeStep.icon className="h-8 w-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-2">
                          {item.brand} {item.model}
                        </h4>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {item.specs?.capacity && (
                            <Badge variant="secondary" className="text-[10px]">
                              {item.specs.capacity}
                            </Badge>
                          )}
                          {item.specs?.frequency && (
                            <Badge variant="secondary" className="text-[10px]">
                              {item.specs.frequency}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                        <Button size="sm" onClick={() => selectHardware(item)}>
                          Selecionar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500">Nenhum componente encontrado.</div>
              )
            ) : // Lista de Produtos Extras no Sheet
            filteredProducts.length > 0 ? (
              filteredProducts.map((item) => {
                const count = getProductCount(item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:border-purple-300 transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="h-16 w-16 bg-white border rounded-lg shrink-0 overflow-hidden">
                        {item.media && item.media[0] ? (
                          <img src={item.media[0].url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-50">
                            <Package className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-slate-800 line-clamp-2">{item.title}</h4>
                        <p className="text-primary font-bold mt-1">{formatPrice(item.totalPrice)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      {count > 0 ? (
                        <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-md bg-white shadow-sm"
                            onClick={() => removeOneProduct(item.id)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-bold text-sm w-4 text-center">{count}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-md bg-white shadow-sm text-green-600"
                            onClick={() => addProduct(item)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => addProduct(item)}
                        >
                          Adicionar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 text-slate-500">Nenhum produto encontrado.</div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
