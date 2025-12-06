import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { api, type Product, type HardwareItem, type MediaItem, type ProductComponents } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Upload, Play, Image, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box } from "lucide-react";
import { HardwareCard } from "@/components/HardwareCard";

// Simple auth - for demo purposes only
const ADMIN_USER = "n8nbalao";
const ADMIN_PASS = "Balao2025";

interface ProductFormData {
  title: string;
  subtitle: string;
  categories: string[];
  media: MediaItem[];
  specs: Record<string, string>;
  components: ProductComponents;
  totalPrice: number;
}

const defaultFormData: ProductFormData = {
  title: "",
  subtitle: "",
  categories: [],
  media: [],
  specs: {},
  components: {},
  totalPrice: 0,
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

export default function Admin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  const [products, setProducts] = useState<Product[]>([]);
  const [hardware, setHardware] = useState<Record<string, HardwareItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [newCategory, setNewCategory] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    if (saved === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  async function fetchData() {
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

  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
        setFormData(prev => ({
          ...prev,
          media: [...prev.media, { type, url: reader.result as string }],
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeMedia(index: number) {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  }

  function addCategory() {
    if (newCategory.trim()) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
      }));
      setNewCategory("");
    }
  }

  function removeCategory(index: number) {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  }

  function addSpec() {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specs: { ...prev.specs, [newSpecKey.trim()]: newSpecValue.trim() },
      }));
      setNewSpecKey("");
      setNewSpecValue("");
    }
  }

  function removeSpec(key: string) {
    setFormData(prev => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[key];
      return { ...prev, specs: newSpecs };
    });
  }

  function selectComponent(category: string, item: HardwareItem | undefined) {
    setFormData(prev => {
      const newComponents = { ...prev.components, [category]: item };
      // Calculate total price from components
      const totalPrice = Object.values(newComponents).reduce((sum, hw) => sum + (hw?.price || 0), 0);
      return { ...prev, components: newComponents, totalPrice };
    });
  }

  function openEditor(product?: Product) {
    if (product) {
      setEditingId(product.id);
      setFormData({
        title: product.title,
        subtitle: product.subtitle || "",
        categories: product.categories || [],
        media: product.media || [],
        specs: product.specs || {},
        components: product.components || {},
        totalPrice: product.totalPrice,
      });
    } else {
      setEditingId(null);
      setFormData(defaultFormData);
    }
    setIsEditing(true);
  }

  function closeEditor() {
    setIsEditing(false);
    setEditingId(null);
    setFormData(defaultFormData);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.title) {
      toast({ title: "Erro", description: "O título é obrigatório", variant: "destructive" });
      return;
    }

    // Check all mandatory components
    const missingComponents = componentSteps.filter(
      step => !formData.components[step.key as keyof ProductComponents]
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

    if (editingId) {
      success = await api.updateProduct(editingId, formData);
    } else {
      success = await api.createProduct(formData);
    }

    if (success) {
      toast({ title: "Sucesso", description: editingId ? "Produto atualizado!" : "Produto criado!" });
      closeEditor();
      fetchData();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const success = await api.deleteProduct(id);
      if (success) {
        toast({ title: "Sucesso", description: "Produto excluído!" });
        fetchData();
      } else {
        toast({ title: "Erro", description: "Falha ao excluir produto", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="py-12">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Painel de Controle</h1>
              <p className="mt-2 text-muted-foreground">Gerencie seus produtos</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => openEditor()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Novo PC
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:bg-secondary"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Products Table */}
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
                            onClick={() => openEditor(product)}
                            className="rounded-lg bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
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
        </div>
      </main>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? "Editar PC" : "Montar Novo PC"}
              </h2>
              <button onClick={closeEditor} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Título *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Nome do PC"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Subtítulo</label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Descrição curta"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Mídia (Fotos e Vídeos)</label>
                <div className="mb-4 flex flex-wrap gap-4">
                  {formData.media.map((item, i) => (
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
                  const selected = formData.components[step.key as keyof ProductComponents];

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
                          Nenhum {step.label.toLowerCase()} cadastrado. Adicione na página de Hardware.
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
                <p className="text-4xl font-bold text-primary">{formatPrice(formData.totalPrice)}</p>
              </div>

              {/* Categories */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Categorias</label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {formData.categories.map((cat, i) => (
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
                  {Object.entries(formData.specs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2">
                      <span className="text-foreground">
                        <strong>{key}:</strong> {value}
                      </span>
                      <button type="button" onClick={() => removeSpec(key)} className="text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Chave"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Valor"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpec())}
                  />
                  <button
                    type="button"
                    onClick={addSpec}
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
                  onClick={closeEditor}
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