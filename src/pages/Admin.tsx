import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { api, type Product, type HardwareItem, type MediaItem, type ProductComponents, type CompanyData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Upload, Play, Image, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box, Package, Download, Droplets, Building2 } from "lucide-react";
import * as XLSX from "xlsx";
import { HardwareCard } from "@/components/HardwareCard";

// Simple auth - for demo purposes only
const ADMIN_USER = "n8nbalao";
const ADMIN_PASS = "Balao2025";

type AdminTab = 'products' | 'hardware' | 'company';
type HardwareCategory = 'processor' | 'motherboard' | 'memory' | 'storage' | 'gpu' | 'psu' | 'case' | 'watercooler' | 'kit' | 'notebook' | 'automacao';

interface ProductFormData {
  title: string;
  subtitle: string;
  categories: string[];
  media: MediaItem[];
  specs: Record<string, string>;
  components: ProductComponents;
  totalPrice: number;
}

interface HardwareFormData {
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  specs: Record<string, string>;
  category: HardwareCategory;
  // Compatibility fields
  socket?: string;
  memoryType?: string;
  formFactor?: string;
  tdp?: number;
}

// Compatibility options
const socketOptions = [
  { value: 'LGA1700', label: 'Intel LGA 1700 (12ª-14ª Gen)' },
  { value: 'LGA1200', label: 'Intel LGA 1200 (10ª-11ª Gen)' },
  { value: 'AM5', label: 'AMD AM5 (Ryzen 7000+)' },
  { value: 'AM4', label: 'AMD AM4 (Ryzen 1000-5000)' },
];

const memoryTypeOptions = [
  { value: 'DDR5', label: 'DDR5' },
  { value: 'DDR4', label: 'DDR4' },
];

const formFactorOptions = [
  { value: 'ATX', label: 'ATX' },
  { value: 'Micro-ATX', label: 'Micro-ATX' },
  { value: 'Mini-ITX', label: 'Mini-ITX' },
  { value: 'E-ATX', label: 'E-ATX' },
];

const defaultProductFormData: ProductFormData = {
  title: "",
  subtitle: "",
  categories: [],
  media: [],
  specs: {},
  components: {},
  totalPrice: 0,
};

const defaultHardwareFormData: HardwareFormData = {
  name: "",
  brand: "",
  model: "",
  price: 0,
  image: "",
  specs: {},
  category: "processor",
  socket: "",
  memoryType: "",
  formFactor: "",
  tdp: 0,
};

const componentSteps = [
  { key: 'processor', label: 'Processador', icon: Cpu },
  { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
  { key: 'watercooler', label: 'Watercooler', icon: Droplets },
  { key: 'psu', label: 'Fonte', icon: Zap },
  { key: 'case', label: 'Gabinete', icon: Box },
] as const;

const hardwareCategories: { key: HardwareCategory; label: string; icon: React.ElementType }[] = [
  { key: 'processor', label: 'Processadores', icon: Cpu },
  { key: 'motherboard', label: 'Placas-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placas de Vídeo', icon: Monitor },
  { key: 'psu', label: 'Fontes', icon: Zap },
  { key: 'case', label: 'Gabinetes', icon: Box },
  { key: 'watercooler', label: 'Watercooler', icon: Droplets },
  { key: 'kit', label: 'Kits', icon: Package },
  { key: 'notebook', label: 'Notebooks', icon: Monitor },
  { key: 'automacao', label: 'Automações', icon: Zap },
];

export default function Admin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [hardware, setHardware] = useState<Record<string, HardwareItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState<ProductFormData>(defaultProductFormData);
  const [newCategory, setNewCategory] = useState("");
  const [newProductSpecKey, setNewProductSpecKey] = useState("");
  const [newProductSpecValue, setNewProductSpecValue] = useState("");

  // Hardware state
  const [activeHardwareCategory, setActiveHardwareCategory] = useState<HardwareCategory>('processor');
  const [hardwareList, setHardwareList] = useState<HardwareItem[]>([]);
  const [isEditingHardware, setIsEditingHardware] = useState(false);
  const [editingHardwareId, setEditingHardwareId] = useState<string | null>(null);
  const [hardwareFormData, setHardwareFormData] = useState<HardwareFormData>(defaultHardwareFormData);
  const [newHardwareSpecKey, setNewHardwareSpecKey] = useState("");
  const [newHardwareSpecValue, setNewHardwareSpecValue] = useState("");

  // Company state
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
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    if (saved === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'products') {
        fetchProductsData();
      } else if (activeTab === 'hardware') {
        fetchHardwareData();
      } else if (activeTab === 'company') {
        fetchCompanyData();
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab, activeHardwareCategory]);

  async function fetchProductsData() {
    setLoading(true);
    const [productsData, ...hardwareData] = await Promise.all([
      api.getProducts(),
      ...componentSteps.map(step => api.getHardware(step.key)),
    ]);
    
    setProducts(productsData);
    
    const hardwareByCategory: Record<string, HardwareItem[]> = {};
    componentSteps.forEach((step, i) => {
      hardwareByCategory[step.key] = hardwareData[i];
    });
    setHardware(hardwareByCategory);
    setLoading(false);
  }

  async function fetchHardwareData() {
    setLoading(true);
    const data = await api.getHardware(activeHardwareCategory);
    setHardwareList(data);
    setLoading(false);
  }

  async function fetchCompanyData() {
    setLoading(true);
    const data = await api.getCompany();
    setCompanyData(data);
    setLoading(false);
  }

  async function handleCompanySave() {
    setSavingCompany(true);
    const success = await api.saveCompany(companyData);
    if (success) {
      toast({ title: "Sucesso", description: "Dados da empresa salvos!" });
    } else {
      toast({ title: "Erro", description: "Falha ao salvar dados", variant: "destructive" });
    }
    setSavingCompany(false);
  }

  function handleCompanyLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyData(prev => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }


  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loginData.user === ADMIN_USER && loginData.pass === ADMIN_PASS) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso" });
    } else {
      toast({ title: "Erro", description: "Credenciais inválidas", variant: "destructive" });
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    sessionStorage.removeItem("admin_auth");
  }

  // Product functions
  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
        setProductFormData(prev => ({
          ...prev,
          media: [...prev.media, { type, url: reader.result as string }],
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  const [videoUrlInput, setVideoUrlInput] = useState("");

  function addVideoByUrl() {
    if (!videoUrlInput.trim()) return;
    
    let videoUrl = videoUrlInput.trim();
    
    // Convert YouTube URLs to embed format
    if (videoUrl.includes('youtube.com/watch')) {
      const videoId = new URL(videoUrl).searchParams.get('v');
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      }
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      }
    }
    
    setProductFormData(prev => ({
      ...prev,
      media: [...prev.media, { type: 'video', url: videoUrl }],
    }));
    setVideoUrlInput("");
  }

  // Hardware image upload
  function handleHardwareImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setHardwareFormData(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function removeMedia(index: number) {
    setProductFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  }

  function addCategory() {
    if (newCategory.trim()) {
      setProductFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
      }));
      setNewCategory("");
    }
  }

  function removeCategory(index: number) {
    setProductFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  }

  function addProductSpec() {
    if (newProductSpecKey.trim() && newProductSpecValue.trim()) {
      setProductFormData(prev => ({
        ...prev,
        specs: { ...prev.specs, [newProductSpecKey.trim()]: newProductSpecValue.trim() },
      }));
      setNewProductSpecKey("");
      setNewProductSpecValue("");
    }
  }

  function removeProductSpec(key: string) {
    setProductFormData(prev => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[key];
      return { ...prev, specs: newSpecs };
    });
  }

  function selectComponent(category: string, item: HardwareItem | undefined) {
    setProductFormData(prev => {
      const newComponents = { ...prev.components, [category]: item };
      const totalPrice = Object.values(newComponents).reduce((sum, hw) => sum + (hw?.price || 0), 0);
      return { ...prev, components: newComponents, totalPrice };
    });
  }

  function openProductEditor(product?: Product) {
    if (product) {
      setEditingProductId(product.id);
      setProductFormData({
        title: product.title,
        subtitle: product.subtitle || "",
        categories: product.categories || [],
        media: product.media || [],
        specs: product.specs || {},
        components: product.components || {},
        totalPrice: product.totalPrice,
      });
    } else {
      setEditingProductId(null);
      setProductFormData(defaultProductFormData);
    }
    setIsEditingProduct(true);
  }

  function closeProductEditor() {
    setIsEditingProduct(false);
    setEditingProductId(null);
    setProductFormData(defaultProductFormData);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productFormData.title) {
      toast({ title: "Erro", description: "O título é obrigatório", variant: "destructive" });
      return;
    }

    const missingComponents = componentSteps.filter(
      step => !productFormData.components[step.key as keyof ProductComponents]
    );

    if (missingComponents.length > 0) {
      toast({
        title: "Componentes obrigatórios",
        description: `Selecione: ${missingComponents.map(c => c.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    let success: boolean;

    if (editingProductId) {
      success = await api.updateProduct(editingProductId, productFormData);
    } else {
      success = await api.createProduct(productFormData);
    }

    if (success) {
      toast({ title: "Sucesso", description: editingProductId ? "Produto atualizado!" : "Produto criado!" });
      closeProductEditor();
      fetchProductsData();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
    }
  }

  async function handleProductDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const success = await api.deleteProduct(id);
      if (success) {
        toast({ title: "Sucesso", description: "Produto excluído!" });
        fetchProductsData();
      } else {
        toast({ title: "Erro", description: "Falha ao excluir produto", variant: "destructive" });
      }
    }
  }

  // Hardware functions

  function addHardwareSpec() {
    if (newHardwareSpecKey.trim() && newHardwareSpecValue.trim()) {
      setHardwareFormData(prev => ({
        ...prev,
        specs: { ...prev.specs, [newHardwareSpecKey.trim()]: newHardwareSpecValue.trim() },
      }));
      setNewHardwareSpecKey("");
      setNewHardwareSpecValue("");
    }
  }

  function removeHardwareSpec(key: string) {
    setHardwareFormData(prev => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[key];
      return { ...prev, specs: newSpecs };
    });
  }

  function openHardwareEditor(item?: HardwareItem) {
    if (item) {
      setEditingHardwareId(item.id);
      setHardwareFormData({
        name: item.name,
        brand: item.brand,
        model: item.model,
        price: item.price,
        image: item.image || "",
        specs: item.specs || {},
        category: item.category,
        socket: item.socket || "",
        memoryType: item.memoryType || "",
        formFactor: item.formFactor || "",
        tdp: item.tdp || 0,
      });
    } else {
      setEditingHardwareId(null);
      setHardwareFormData({ ...defaultHardwareFormData, category: activeHardwareCategory });
    }
    setIsEditingHardware(true);
  }

  function closeHardwareEditor() {
    setIsEditingHardware(false);
    setEditingHardwareId(null);
    setHardwareFormData(defaultHardwareFormData);
  }

  async function handleHardwareSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!hardwareFormData.name || !hardwareFormData.brand || !hardwareFormData.model) {
      toast({ title: "Erro", description: "Preencha nome, marca e modelo", variant: "destructive" });
      return;
    }

    let success: boolean;

    if (editingHardwareId) {
      success = await api.updateHardware(editingHardwareId, hardwareFormData);
    } else {
      success = await api.createHardware(hardwareFormData);
    }

    if (success) {
      toast({ title: "Sucesso", description: editingHardwareId ? "Hardware atualizado!" : "Hardware criado!" });
      closeHardwareEditor();
      fetchHardwareData();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar hardware", variant: "destructive" });
    }
  }

  async function handleHardwareDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const success = await api.deleteHardware(id);
      if (success) {
        toast({ title: "Sucesso", description: "Hardware excluído!" });
        fetchHardwareData();
      } else {
        toast({ title: "Erro", description: "Falha ao excluir hardware", variant: "destructive" });
      }
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Bulk upload functions
  function downloadExcelTemplate() {
    const templateData = [
      {
        nome: "Exemplo Processador",
        marca: "Intel",
        modelo: "Core i7-13700K",
        preco: 2499.99,
        categoria: activeHardwareCategory,
        spec_1_chave: "Núcleos",
        spec_1_valor: "16",
        spec_2_chave: "Threads",
        spec_2_valor: "24",
        spec_3_chave: "Frequência",
        spec_3_valor: "3.4GHz",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hardware");

    // Auto-size columns
    ws["!cols"] = [
      { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    ];

    XLSX.writeFile(wb, `template_hardware_${activeHardwareCategory}.xlsx`);
    toast({ title: "Download iniciado", description: "Use este modelo para envio em massa" });
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        const specs: Record<string, string> = {};
        
        // Extract specs from columns
        for (let i = 1; i <= 10; i++) {
          const key = row[`spec_${i}_chave`];
          const value = row[`spec_${i}_valor`];
          if (key && value) {
            specs[key] = String(value);
          }
        }

        const hardwareItem = {
          name: row.nome || "",
          brand: row.marca || "",
          model: row.modelo || "",
          price: parseFloat(row.preco) || 0,
          image: "",
          specs,
          category: (row.categoria || activeHardwareCategory) as HardwareCategory,
        };

        if (hardwareItem.name && hardwareItem.brand && hardwareItem.model) {
          const success = await api.createHardware(hardwareItem);
          if (success) successCount++;
          else errorCount++;
        } else {
          errorCount++;
        }
      }

      toast({
        title: "Upload concluído",
        description: `${successCount} itens criados, ${errorCount} erros`,
      });
      fetchHardwareData();
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Painel Admin</h1>
            <p className="mt-2 text-muted-foreground">Acesso restrito</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Usuário</label>
              <input
                type="text"
                value={loginData.user}
                onChange={(e) => setLoginData(prev => ({ ...prev, user: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Digite seu usuário"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Senha</label>
              <input
                type="password"
                value={loginData.pass}
                onChange={(e) => setLoginData(prev => ({ ...prev, pass: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Digite sua senha"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  const ActiveHardwareIcon = hardwareCategories.find(c => c.key === activeHardwareCategory)?.icon || Cpu;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="py-12">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Painel de Controle</h1>
              <p className="mt-2 text-muted-foreground">Gerencie produtos e componentes</p>
            </div>
            <div className="flex gap-4">
              {activeTab !== 'company' && (
                <button
                  onClick={() => activeTab === 'products' ? openProductEditor() : openHardwareEditor()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-5 w-5" />
                  {activeTab === 'products' ? 'Novo PC' : 'Novo Item'}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:bg-secondary"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
                activeTab === 'products'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <Package className="h-5 w-5" />
              PCs Montados
            </button>
            <button
              onClick={() => setActiveTab('hardware')}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
                activeTab === 'hardware'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <Cpu className="h-5 w-5" />
              Hardware
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
                activeTab === 'company'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </button>
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <>
              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Mídia</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Título</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Componentes</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Preço</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-secondary/50">
                          <td className="px-6 py-4">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                              {product.media?.[0]?.type === 'video' ? (
                                <Play className="h-6 w-6 text-muted-foreground" />
                              ) : (
                                <img
                                  src={product.media?.[0]?.url || "/placeholder.svg"}
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">{product.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {Object.keys(product.components || {}).length} componentes
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary">{formatPrice(product.totalPrice)}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openProductEditor(product)}
                                className="rounded-lg bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleProductDelete(product.id)}
                                className="rounded-lg bg-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                            Nenhum produto cadastrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <div className="max-w-2xl">
              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-xl font-bold text-foreground mb-6">Dados da Empresa</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Estes dados serão exibidos nos orçamentos gerados pelos clientes.
                  </p>

                  <div className="space-y-4">
                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Logo da Empresa</label>
                      <div className="flex items-center gap-4">
                        {companyData.logo ? (
                          <img
                            src={companyData.logo}
                            alt="Logo"
                            className="h-20 w-20 object-contain rounded-lg border border-border bg-background"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-lg border border-dashed border-border bg-secondary flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                          <Upload className="h-4 w-4" />
                          Enviar Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCompanyLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {companyData.logo && (
                          <button
                            onClick={() => setCompanyData(prev => ({ ...prev, logo: '' }))}
                            className="text-sm text-destructive hover:underline"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nome da Empresa</label>
                      <input
                        type="text"
                        value={companyData.name}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Nome da sua empresa"
                      />
                    </div>

                    {/* CNPJ */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">CNPJ</label>
                      <input
                        type="text"
                        value={companyData.cnpj}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, cnpj: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                      <input
                        type="text"
                        value={companyData.address}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Rua, número, bairro"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Cidade/Estado</label>
                      <input
                        type="text"
                        value={companyData.city}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="São Paulo - SP"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                      <input
                        type="text"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                      <input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="contato@empresa.com"
                      />
                    </div>

                    {/* Seller */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Vendedor</label>
                      <input
                        type="text"
                        value={companyData.seller}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, seller: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Nome do vendedor"
                      />
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                      <button
                        onClick={handleCompanySave}
                        disabled={savingCompany}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Save className="h-5 w-5" />
                        {savingCompany ? 'Salvando...' : 'Salvar Dados'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hardware Tab */}
          {activeTab === 'hardware' && (
            <>
              {/* Bulk Upload Button */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={downloadExcelTemplate}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Envio em Massa
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                  <Upload className="h-4 w-4" />
                  Importar Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Hardware Category Tabs */}
              <div className="mb-6 flex flex-wrap gap-2">
                {hardwareCategories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveHardwareCategory(cat.key)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        activeHardwareCategory === cat.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Imagem</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nome</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Marca/Modelo</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Preço</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {hardwareList.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/50">
                          <td className="px-6 py-4">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <ActiveHardwareIcon className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {item.brand} {item.model}
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary">{formatPrice(item.price)}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openHardwareEditor(item)}
                                className="rounded-lg bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleHardwareDelete(item.id)}
                                className="rounded-lg bg-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {hardwareList.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                            Nenhum item cadastrado nesta categoria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Product Editor Modal */}
      {isEditingProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {editingProductId ? "Editar PC" : "Montar Novo PC"}
              </h2>
              <button onClick={closeProductEditor} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Título *</label>
                  <input
                    type="text"
                    value={productFormData.title}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Nome do PC"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Subtítulo</label>
                  <input
                    type="text"
                    value={productFormData.subtitle}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Descrição curta"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Mídia (Fotos e Vídeos)</label>
                <div className="mb-4 flex flex-wrap gap-4">
                  {productFormData.media.map((item, i) => (
                    <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg bg-secondary">
                      {item.type === 'video' ? (
                        item.url.includes('youtube.com/embed') ? (
                          <div className="h-full w-full flex items-center justify-center bg-red-600">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        ) : (
                          <video src={item.url} className="h-full w-full object-cover" muted />
                        )
                      ) : (
                        <img src={item.url} alt={`Media ${i + 1}`} className="h-full w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1 text-xs">
                        {item.type === 'video' ? <Play className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                      </div>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Upload className="h-6 w-6" />
                    <span className="mt-1 text-xs">Upload</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {/* YouTube Video URL Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Cole o link do YouTube aqui..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addVideoByUrl())}
                  />
                  <button
                    type="button"
                    onClick={addVideoByUrl}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                  >
                    <Play className="h-4 w-4" />
                    Adicionar Vídeo
                  </button>
                </div>
              </div>

              {/* Component Selection - Step by Step */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Componentes Obrigatórios</h3>
                
                {/* Progress indicators */}
                <div className="flex flex-wrap gap-2">
                  {componentSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = !!productFormData.components[step.key as keyof ProductComponents];
                    const currentStepIndex = componentSteps.findIndex(
                      s => !productFormData.components[s.key as keyof ProductComponents]
                    );
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : isCurrent
                            ? 'bg-primary/20 text-primary border border-primary'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{step.label}</span>
                        {isCompleted && <span>✓</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Current step selection */}
                {(() => {
                  const currentStepIndex = componentSteps.findIndex(
                    s => !productFormData.components[s.key as keyof ProductComponents]
                  );
                  
                  // All steps completed
                  if (currentStepIndex === -1) {
                    return (
                      <div className="rounded-xl border border-primary bg-primary/10 p-6 text-center">
                        <p className="text-lg font-semibold text-primary">Todos os componentes selecionados!</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Você pode clicar nos componentes abaixo para alterar a seleção.
                        </p>
                        
                        {/* Show all selected components for editing */}
                        <div className="mt-4 space-y-3 text-left">
                          {componentSteps.map(step => {
                            const Icon = step.icon;
                            const selected = productFormData.components[step.key as keyof ProductComponents];
                            if (!selected) return null;
                            
                            return (
                              <div
                                key={step.key}
                                onClick={() => selectComponent(step.key, undefined)}
                                className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-destructive hover:bg-destructive/10"
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                                    <p className="text-sm text-muted-foreground">{selected.brand} {selected.model}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-primary">{formatPrice(selected.price)}</span>
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  
                  const currentStep = componentSteps[currentStepIndex];
                  const Icon = currentStep.icon;
                  const items = (hardware[currentStep.key] || []).sort((a, b) => a.price - b.price);
                  
                  return (
                    <div className="rounded-xl border border-primary bg-card p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {currentStepIndex + 1}
                        </div>
                        <Icon className="h-5 w-5 text-primary" />
                        <h4 className="font-medium text-foreground">Selecione o {currentStep.label}</h4>
                        <span className="ml-auto text-sm text-muted-foreground">
                          Passo {currentStepIndex + 1} de {componentSteps.length}
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum {currentStep.label.toLowerCase()} cadastrado. Adicione na aba Hardware.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {items.map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => selectComponent(currentStep.key, item)}
                              className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary/5"
                            >
                              <div className="flex items-center gap-4">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-foreground">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">{item.brand} {item.model}</p>
                                </div>
                              </div>
                              <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Show already selected components */}
                      {currentStepIndex > 0 && (
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">Já selecionados:</p>
                          <div className="flex flex-wrap gap-2">
                            {componentSteps.slice(0, currentStepIndex).map(step => {
                              const StepIcon = step.icon;
                              const selected = productFormData.components[step.key as keyof ProductComponents];
                              if (!selected) return null;
                              
                              return (
                                <div
                                  key={step.key}
                                  onClick={() => selectComponent(step.key, undefined)}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm transition-colors hover:bg-destructive/20"
                                >
                                  <StepIcon className="h-4 w-4 text-primary" />
                                  <span className="text-foreground">{selected.brand} {selected.model}</span>
                                  <span className="text-primary">{formatPrice(selected.price)}</span>
                                  <X className="h-3 w-3 text-muted-foreground" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Total Price */}
              <div className="rounded-xl bg-primary/10 p-6 text-center">
                <p className="text-sm text-muted-foreground">Preço Total</p>
                <p className="text-4xl font-bold text-primary">{formatPrice(productFormData.totalPrice)}</p>
              </div>

              {/* Categories */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Categorias</label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {productFormData.categories.map((cat, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-sm text-primary">
                      {cat}
                      <button type="button" onClick={() => removeCategory(i)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Nova categoria"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="rounded-lg bg-secondary px-4 py-2 text-foreground transition-colors hover:bg-secondary/80"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Extra Specs */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Especificações Extras</label>
                <div className="mb-2 space-y-2">
                  {Object.entries(productFormData.specs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2">
                      <span className="text-foreground">
                        <strong>{key}:</strong> {value}
                      </span>
                      <button type="button" onClick={() => removeProductSpec(key)} className="text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProductSpecKey}
                    onChange={(e) => setNewProductSpecKey(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Chave"
                  />
                  <input
                    type="text"
                    value={newProductSpecValue}
                    onChange={(e) => setNewProductSpecValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Valor"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addProductSpec())}
                  />
                  <button
                    type="button"
                    onClick={addProductSpec}
                    className="rounded-lg bg-secondary px-4 py-2 text-foreground transition-colors hover:bg-secondary/80"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                >
                  <Save className="h-5 w-5" />
                  Salvar PC
                </button>
                <button
                  type="button"
                  onClick={closeProductEditor}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hardware Editor Modal */}
      {isEditingHardware && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {editingHardwareId ? "Editar Hardware" : "Novo Hardware"}
              </h2>
              <button onClick={closeHardwareEditor} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleHardwareSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Categoria *</label>
                <select
                  value={hardwareFormData.category}
                  onChange={(e) => setHardwareFormData(prev => ({ ...prev, category: e.target.value as HardwareCategory }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                >
                  {hardwareCategories.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Nome *</label>
                  <input
                    type="text"
                    value={hardwareFormData.name}
                    onChange={(e) => setHardwareFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Nome do componente"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Marca *</label>
                  <input
                    type="text"
                    value={hardwareFormData.brand}
                    onChange={(e) => setHardwareFormData(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Ex: Intel, AMD, NVIDIA"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Modelo *</label>
                  <input
                    type="text"
                    value={hardwareFormData.model}
                    onChange={(e) => setHardwareFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Ex: Core i7-13700K"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={hardwareFormData.price}
                    onChange={(e) => setHardwareFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Hardware Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Imagem do Produto</label>
                <div className="flex items-center gap-4">
                  {hardwareFormData.image ? (
                    <img
                      src={hardwareFormData.image}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border bg-secondary flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                      <Upload className="h-4 w-4" />
                      Enviar Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHardwareImageUpload}
                        className="hidden"
                      />
                    </label>
                    {hardwareFormData.image && (
                      <button
                        type="button"
                        onClick={() => setHardwareFormData(prev => ({ ...prev, image: '' }))}
                        className="text-sm text-destructive hover:underline"
                      >
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(hardwareFormData.category === 'processor' || hardwareFormData.category === 'motherboard' || hardwareFormData.category === 'watercooler') && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-primary">🔗 Campos de Compatibilidade</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Socket *</label>
                      <select
                        value={hardwareFormData.socket || ""}
                        onChange={(e) => setHardwareFormData(prev => ({ ...prev, socket: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="">Selecione o socket</option>
                        {socketOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {hardwareFormData.category === 'processor' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">TDP (Watts)</label>
                        <input
                          type="number"
                          value={hardwareFormData.tdp || ""}
                          onChange={(e) => setHardwareFormData(prev => ({ ...prev, tdp: parseInt(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                          placeholder="Ex: 125"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hardwareFormData.category === 'motherboard' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Tipo de Memória *</label>
                    <select
                      value={hardwareFormData.memoryType || ""}
                      onChange={(e) => setHardwareFormData(prev => ({ ...prev, memoryType: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {memoryTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Form Factor *</label>
                    <select
                      value={hardwareFormData.formFactor || ""}
                      onChange={(e) => setHardwareFormData(prev => ({ ...prev, formFactor: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {formFactorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {hardwareFormData.category === 'memory' && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-primary">🔗 Campos de Compatibilidade</h3>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Tipo de Memória *</label>
                    <select
                      value={hardwareFormData.memoryType || ""}
                      onChange={(e) => setHardwareFormData(prev => ({ ...prev, memoryType: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {memoryTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {hardwareFormData.category === 'case' && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-primary">🔗 Campos de Compatibilidade</h3>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Form Factors Suportados *</label>
                    <select
                      value={hardwareFormData.formFactor || ""}
                      onChange={(e) => setHardwareFormData(prev => ({ ...prev, formFactor: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {formFactorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">Gabinetes maiores suportam placas menores (ATX suporta Micro-ATX e Mini-ITX)</p>
                  </div>
                </div>
              )}

              {/* Specs */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Especificações</label>
                <div className="mb-2 space-y-2">
                  {Object.entries(hardwareFormData.specs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2">
                      <span className="text-foreground">
                        <strong>{key}:</strong> {value}
                      </span>
                      <button type="button" onClick={() => removeHardwareSpec(key)} className="text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHardwareSpecKey}
                    onChange={(e) => setNewHardwareSpecKey(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Chave"
                  />
                  <input
                    type="text"
                    value={newHardwareSpecValue}
                    onChange={(e) => setNewHardwareSpecValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Valor"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHardwareSpec())}
                  />
                  <button
                    type="button"
                    onClick={addHardwareSpec}
                    className="rounded-lg bg-secondary px-4 py-2 text-foreground transition-colors hover:bg-secondary/80"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                >
                  <Save className="h-5 w-5" />
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={closeHardwareEditor}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
