import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { api, type Product, type HardwareItem, type MediaItem, type ProductComponents } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Upload, Play, Image, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box, Package } from "lucide-react";
import { HardwareCard } from "@/components/HardwareCard";

// Simple auth - for demo purposes only
const ADMIN_USER = "n8nbalao";
const ADMIN_PASS = "Balao2025";

type AdminTab = 'products' | 'hardware';
type HardwareCategory = 'processor' | 'motherboard' | 'memory' | 'storage' | 'gpu' | 'psu' | 'case';

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
}

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
};

const componentSteps = [
  { key: 'processor', label: 'Processador', icon: Cpu },
  { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
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
      } else {
        fetchHardwareData();
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
  function handleHardwareImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHardwareFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

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
              <button
                onClick={() => activeTab === 'products' ? openProductEditor() : openHardwareEditor()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                {activeTab === 'products' ? 'Novo PC' : 'Novo Item'}
              </button>
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

          {/* Hardware Tab */}
          {activeTab === 'hardware' && (
            <>
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
                        <video src={item.url} className="h-full w-full object-cover" muted />
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
                    <span className="mt-1 text-xs">Adicionar</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Component Selection */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Componentes Obrigatórios</h3>
                
                {componentSteps.map(step => {
                  const Icon = step.icon;
                  const items = hardware[step.key] || [];
                  const selected = productFormData.components[step.key as keyof ProductComponents];

                  return (
                    <div key={step.key} className="rounded-xl border border-border p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <h4 className="font-medium text-foreground">{step.label}</h4>
                        {selected && (
                          <span className="ml-auto text-sm text-primary">✓ Selecionado</span>
                        )}
                      </div>

                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum {step.label.toLowerCase()} cadastrado. Adicione na aba Hardware.
                        </p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {items.map(item => (
                            <HardwareCard
                              key={item.id}
                              hardware={item}
                              selected={selected?.id === item.id}
                              onSelect={() => selectComponent(step.key, selected?.id === item.id ? undefined : item)}
                              showSelect
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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

              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Imagem</label>
                <div className="flex items-center gap-4">
                  {hardwareFormData.image && (
                    <img src={hardwareFormData.image} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Upload className="h-5 w-5" />
                    <span>Upload imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHardwareImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

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
