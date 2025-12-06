import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { api, type Product } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Upload } from "lucide-react";

interface ProductFormData {
  title: string;
  subtitle: string;
  categories: string[];
  image: string;
  specs: Record<string, string>;
  totalPrice: number;
}

const defaultFormData: ProductFormData = {
  title: "",
  subtitle: "",
  categories: [],
  image: "",
  specs: {},
  totalPrice: 0,
};

export default function Painel() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [newCategory, setNewCategory] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const data = await api.getProducts();
    setProducts(data);
    setLoading(false);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }

  function addCategory() {
    if (newCategory.trim()) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
      }));
      setNewCategory("");
    }
  }

  function removeCategory(index: number) {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  }

  function addSpec() {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        specs: { ...prev.specs, [newSpecKey.trim()]: newSpecValue.trim() },
      }));
      setNewSpecKey("");
      setNewSpecValue("");
    }
  }

  function removeSpec(key: string) {
    setFormData((prev) => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[key];
      return { ...prev, specs: newSpecs };
    });
  }

  function openEditor(product?: Product) {
    if (product) {
      setEditingId(product.id);
      setFormData({
        title: product.title,
        subtitle: product.subtitle || "",
        categories: product.categories || [],
        image: product.image || "",
        specs: product.specs || {},
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

    let success: boolean;

    if (editingId) {
      success = await api.updateProduct(editingId, formData);
    } else {
      success = await api.createProduct(formData);
    }

    if (success) {
      toast({ title: "Sucesso", description: editingId ? "Produto atualizado!" : "Produto criado!" });
      closeEditor();
      fetchProducts();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const success = await api.deleteProduct(id);
      if (success) {
        toast({ title: "Sucesso", description: "Produto excluído!" });
        fetchProducts();
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
            <button
              onClick={() => openEditor()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
              Novo Produto
            </button>
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="h-64 animate-pulse rounded-xl bg-card" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full">
                <thead className="border-b border-border bg-secondary">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Imagem</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Título</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Categorias</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Preço</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-secondary/50">
                      <td className="px-6 py-4">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-12 w-12 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{product.title}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.categories?.map((cat) => (
                            <span key={cat} className="rounded-full bg-primary/20 px-2 py-1 text-xs text-primary">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-primary font-semibold">{formatPrice(product.totalPrice)}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {editingId ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button onClick={closeEditor} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nome do produto"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Subtítulo</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Descrição curta"
                />
              </div>

              {/* Price */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="0.00"
                />
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
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Chave"
                  />
                  <input
                    type="text"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
