import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { api, type HardwareItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Upload, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box } from "lucide-react";

// Simple auth - for demo purposes only
const ADMIN_USER = "n8nbalao";
const ADMIN_PASS = "Balao2025";

type HardwareCategory = 'processor' | 'motherboard' | 'memory' | 'storage' | 'gpu' | 'psu' | 'case';

const categories: { key: HardwareCategory; label: string; icon: React.ElementType }[] = [
  { key: 'processor', label: 'Processadores', icon: Cpu },
  { key: 'motherboard', label: 'Placas-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placas de Vídeo', icon: Monitor },
  { key: 'psu', label: 'Fontes', icon: Zap },
  { key: 'case', label: 'Gabinetes', icon: Box },
];

interface HardwareFormData {
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  specs: Record<string, string>;
  category: HardwareCategory;
}

const defaultFormData: HardwareFormData = {
  name: "",
  brand: "",
  model: "",
  price: 0,
  image: "",
  specs: {},
  category: "processor",
};

export default function Hardware() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  const [activeCategory, setActiveCategory] = useState<HardwareCategory>('processor');
  const [hardware, setHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HardwareFormData>(defaultFormData);
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
      fetchHardware();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, activeCategory]);

  async function fetchHardware() {
    setLoading(true);
    const data = await api.getHardware(activeCategory);
    setHardware(data);
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

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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

  function openEditor(item?: HardwareItem) {
    if (item) {
      setEditingId(item.id);
      setFormData({
        name: item.name,
        brand: item.brand,
        model: item.model,
        price: item.price,
        image: item.image || "",
        specs: item.specs || {},
        category: item.category,
      });
    } else {
      setEditingId(null);
      setFormData({ ...defaultFormData, category: activeCategory });
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

    if (!formData.name || !formData.brand || !formData.model) {
      toast({ title: "Erro", description: "Preencha nome, marca e modelo", variant: "destructive" });
      return;
    }

    let success: boolean;

    if (editingId) {
      success = await api.updateHardware(editingId, formData);
    } else {
      success = await api.createHardware(formData);
    }

    if (success) {
      toast({ title: "Sucesso", description: editingId ? "Hardware atualizado!" : "Hardware criado!" });
      closeEditor();
      fetchHardware();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar hardware", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const success = await api.deleteHardware(id);
      if (success) {
        toast({ title: "Sucesso", description: "Hardware excluído!" });
        fetchHardware();
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
            <h1 className="text-3xl font-bold text-foreground">Hardware</h1>
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

  const ActiveIcon = categories.find(c => c.key === activeCategory)?.icon || Cpu;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="py-12">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Gerenciar Hardware</h1>
              <p className="mt-2 text-muted-foreground">Cadastre componentes para montagem de PCs</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => openEditor()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                Novo Item
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:bg-secondary"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeCategory === cat.key
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

          {/* Hardware Table */}
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
                  {hardware.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <ActiveIcon className="h-6 w-6 text-muted-foreground" />
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
                            onClick={() => openEditor(item)}
                            className="rounded-lg bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="rounded-lg bg-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {hardware.length === 0 && (
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
        </div>
      </main>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? "Editar Hardware" : "Novo Hardware"}
              </h2>
              <button onClick={closeEditor} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Categoria *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as HardwareCategory }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Nome *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Nome do componente"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Marca *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
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
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Ex: Core i7-13700K"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Imagem</label>
                <div className="flex items-center gap-4">
                  {formData.image && (
                    <img src={formData.image} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Upload className="h-5 w-5" />
                    <span>Upload imagem</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Specs */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Especificações</label>
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
                    placeholder="Chave (ex: Cores)"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Valor (ex: 8)"
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
                  Salvar
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