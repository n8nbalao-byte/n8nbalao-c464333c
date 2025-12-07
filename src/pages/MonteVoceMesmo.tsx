import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StarryBackground } from "@/components/StarryBackground";

import { api, type Product, type CompanyData, getCustomCategories } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Check, Printer, ShoppingCart, ArrowLeft, Plus, X, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// All product categories
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

interface SelectedProduct {
  id: string;
  title: string;
  price: number;
  category: string;
  imageUrl?: string;
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

export default function MonteVoceMesmo() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuote, setShowQuote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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

  // Get all categories (default + custom)
  const allCategories = [...defaultCategories, ...getCustomCategories()];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [productsData, company] = await Promise.all([
        api.getProducts(),
        api.getCompany()
      ]);
      
      setProducts(productsData.sort((a, b) => a.totalPrice - b.totalPrice));
      setCompanyData(company);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar dados", variant: "destructive" });
    }
    setLoading(false);
  }

  function addProduct(product: Product) {
    // Check if already added
    if (selectedProducts.some(p => p.id === product.id)) {
      toast({ title: "Atenção", description: "Este produto já foi adicionado ao orçamento", variant: "destructive" });
      return;
    }

    const imageUrl = product.media?.[0]?.url || '';
    
    setSelectedProducts(prev => [...prev, {
      id: product.id,
      title: product.title,
      price: product.totalPrice,
      category: product.categories?.[0] || product.productType || 'outro',
      imageUrl
    }]);

    toast({ title: "Adicionado!", description: `${product.title} foi adicionado ao orçamento` });
  }

  function removeProduct(productId: string) {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  }

  function calculateTotal(): number {
    return selectedProducts.reduce((sum, item) => sum + item.price, 0);
  }

  function generateQuote() {
    if (selectedProducts.length === 0) {
      toast({ title: "Atenção", description: "Adicione pelo menos um produto ao orçamento", variant: "destructive" });
      return;
    }
    setShowQuote(true);
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

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const productCategory = product.categories?.[0] || product.productType || '';
    const matchesCategory = !activeCategory || productCategory === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get category label
  function getCategoryLabel(key: string): string {
    const found = allCategories.find(c => c.key === key);
    return found?.label || key;
  }

  const emissionDate = new Date();
  const validityDate = new Date(emissionDate);
  validityDate.setDate(validityDate.getDate() + 7);

  if (loading) {
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

  if (showQuote) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <Button variant="outline" onClick={() => setShowQuote(false)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={printQuote}>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Orçamento
                </Button>
                <Button onClick={handleBuy} className="bg-green-600 hover:bg-green-700">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Comprar
                </Button>
              </div>
            </div>

            {/* Quote Content */}
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

                {/* Quote Title */}
                <h2 className="quote-title text-2xl font-bold text-center mb-4">
                  ORÇAMENTO
                </h2>

                {/* Date */}
                <div className="quote-date text-right text-sm text-muted-foreground mb-6">
                  Data de Emissão: {formatDate(emissionDate)}
                </div>

                {/* Products Table */}
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
                    <tr className="total-row bg-primary/10 font-bold text-lg">
                      <td className="p-4" colSpan={2}>TOTAL</td>
                      <td className="p-4 text-right text-primary">{formatPrice(calculateTotal())}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Validity */}
                <div className="validity bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center mb-8">
                  <p>
                    <strong className="text-yellow-700">⚠️ Validade do Orçamento:</strong>{" "}
                    <span className="font-semibold">{formatDate(validityDate)}</span> (7 dias após a emissão)
                  </p>
                </div>

                {/* Footer */}
                <div className="footer text-center pt-6 border-t border-border">
                  <p className="thank-you text-lg font-bold text-primary mb-2">
                    Obrigado pela preferência!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Para confirmar seu pedido, entre em contato conosco através dos canais acima.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Os preços podem sofrer alterações sem aviso prévio após o prazo de validade.
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

  return (
    <div className="min-h-screen flex flex-col relative">
      <StarryBackground />
      <Header />
      <main className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Monte Você Mesmo</h1>
            <p className="text-muted-foreground">Escolha produtos de qualquer categoria para montar seu orçamento personalizado</p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search Input */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant={activeCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(null)}
              >
                Todos
              </Button>
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
                    onClick={() => setActiveCategory(cat.key)}
                  >
                    {cat.label} ({count})
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Selected Products Bar */}
          {selectedProducts.length > 0 && (
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border border-border rounded-lg p-4 mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{selectedProducts.length} produto(s) selecionado(s)</span>
                  </div>
                  <div className="hidden md:flex flex-wrap gap-2 max-w-2xl">
                    {selectedProducts.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-xs">
                        <span className="truncate max-w-[100px]">{item.title}</span>
                        <button
                          onClick={() => removeProduct(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {selectedProducts.length > 5 && (
                      <span className="text-xs text-muted-foreground">+{selectedProducts.length - 5} mais</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold text-primary">{formatPrice(calculateTotal())}</p>
                  </div>
                  <Button onClick={generateQuote} className="bg-green-600 hover:bg-green-700">
                    Gerar Orçamento
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.some(p => p.id === product.id);
                const imageUrl = product.media?.[0]?.url || '';
                const productCategory = product.categories?.[0] || product.productType || '';
                
                return (
                  <Card
                    key={product.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      isSelected 
                        ? 'ring-2 ring-green-500 bg-green-500/10' 
                        : 'hover:ring-1 hover:ring-primary/50'
                    }`}
                    onClick={() => isSelected ? removeProduct(product.id) : addProduct(product)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={product.title} 
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                              {getCategoryLabel(productCategory)}
                            </span>
                            <p className="font-semibold text-sm line-clamp-2 mt-1">{product.title}</p>
                            {product.subtitle && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{product.subtitle}</p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-lg font-bold text-primary mt-2">
                          {formatPrice(product.totalPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button 
                        variant={isSelected ? "outline" : "default"} 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          isSelected ? removeProduct(product.id) : addProduct(product);
                        }}
                      >
                        {isSelected ? (
                          <>
                            <X className="mr-1 h-4 w-4" />
                            Remover
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-4 w-4" />
                            Adicionar
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty Cart Message */}
          {selectedProducts.length === 0 && (
            <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Seu orçamento está vazio</h3>
              <p className="text-muted-foreground">
                Clique nos produtos acima para adicionar ao seu orçamento personalizado.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
