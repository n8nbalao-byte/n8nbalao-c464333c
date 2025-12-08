import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Package, Store, Loader2, Check, X, Download, Save, Plus, Code, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

interface ExtractedProduct {
  title: string;
  price: number | null;
  description?: string;
  brand?: string;
  model?: string;
  category?: string;
  specs?: Record<string, string> | string[];
  images?: string[];
  image?: string;
  link?: string;
  selected?: boolean;
  importing?: boolean;
  imported?: boolean;
}

const API_BASE_URL = 'https://n8nbalao.com/api';

const ExtractProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [url, setUrl] = useState('');
  const [manualHtml, setManualHtml] = useState('');
  const [extractType, setExtractType] = useState<'product' | 'store'>('product');
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    toast({
      title: 'API Key salva',
      description: 'Sua chave foi salva localmente no navegador.',
    });
  };

  const extractProducts = async () => {
    if (!apiKey) {
      toast({
        title: 'API Key necessária',
        description: 'Por favor, insira sua chave da API do OpenAI.',
        variant: 'destructive',
      });
      return;
    }

    if (inputMode === 'url' && !url) {
      toast({
        title: 'URL necessária',
        description: 'Por favor, insira a URL do produto ou loja.',
        variant: 'destructive',
      });
      return;
    }

    if (inputMode === 'html' && !manualHtml) {
      toast({
        title: 'HTML necessário',
        description: 'Por favor, cole o código HTML da página.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setExtractedProducts([]);

    try {
      // Limit HTML size to avoid payload issues (max 500KB)
      let htmlToSend = inputMode === 'html' ? manualHtml : undefined;
      if (htmlToSend && htmlToSend.length > 500000) {
        htmlToSend = htmlToSend.substring(0, 500000);
        console.log('HTML truncated to 500KB');
      }

      const response = await fetch(`${API_BASE_URL}/extract.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: inputMode === 'url' ? url : 'manual-html',
          html: htmlToSend,
          apiKey,
          extractType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Erro do servidor: ${response.status}. Verifique se o extract.php foi atualizado no Hostinger.`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao extrair dados');
      }

      // Always convert to array format for consistent handling
      if (result.type === 'store' && Array.isArray(result.data)) {
        // Store extraction returns array of products
        const products = result.data.map((p: any) => ({
          title: p.title || 'Produto sem nome',
          price: typeof p.price === 'number' ? p.price : parseFloat(p.price) || null,
          description: p.description || '',
          brand: p.brand || '',
          model: p.model || '',
          category: p.category || 'acessorio',
          specs: p.specs || {},
          images: p.images || (p.image ? [p.image] : []),
          image: p.image || p.images?.[0] || '',
          link: p.link || '',
          selected: true,
          importing: false,
          imported: false,
        }));
        setExtractedProducts(products);
        
        toast({
          title: 'Extração concluída!',
          description: `${products.length} produtos encontrados.`,
        });
      } else if (result.data) {
        // Single product - convert to array with one item
        const product = result.data;
        setExtractedProducts([{
          title: product.title || 'Produto sem nome',
          price: typeof product.price === 'number' ? product.price : parseFloat(product.price) || null,
          description: product.description || '',
          brand: product.brand || '',
          model: product.model || '',
          category: product.category || 'acessorio',
          specs: product.specs || {},
          images: product.images || [],
          image: product.images?.[0] || '',
          link: product.link || url,
          selected: true,
          importing: false,
          imported: false,
        }]);
        
        toast({
          title: 'Extração concluída!',
          description: 'Dados do produto extraídos com sucesso.',
        });
      }
    } catch (error) {
      console.error('Extraction error:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o arquivo extract.php foi enviado para a pasta /api do Hostinger.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro na extração',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductSelection = (index: number) => {
    setExtractedProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  const selectAll = () => {
    setExtractedProducts(prev => prev.map(p => ({ ...p, selected: true })));
  };

  const deselectAll = () => {
    setExtractedProducts(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const importSingleProduct = async (index: number) => {
    const product = extractedProducts[index];
    if (product.imported) return;

    setExtractedProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], importing: true };
      return updated;
    });

    try {
      // Handle specs - could be array or object
      let specsRecord: Record<string, string> = {};
      if (product.specs) {
        if (Array.isArray(product.specs)) {
          product.specs.forEach((spec, idx) => {
            specsRecord[`spec_${idx + 1}`] = spec;
          });
        } else {
          specsRecord = product.specs as Record<string, string>;
        }
      }
      
      const category = product.category || 'acessorio';
      
      await api.createProduct({
        title: product.title || 'Produto Importado',
        subtitle: product.brand || '',
        description: product.description || '',
        categories: [category],
        productType: category as any,
        media: product.images?.length 
          ? product.images.map(url => ({ type: 'image' as const, url }))
          : product.image 
            ? [{ type: 'image' as const, url: product.image }] 
            : [],
        specs: specsRecord,
        components: {},
        totalPrice: product.price || 0,
      });

      setExtractedProducts(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], importing: false, imported: true };
        return updated;
      });

      toast({
        title: 'Produto importado!',
        description: product.title,
      });
    } catch (error) {
      console.error('Error importing product:', error);
      
      setExtractedProducts(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], importing: false };
        return updated;
      });

      toast({
        title: 'Erro ao importar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const importSelectedProducts = async () => {
    const selectedProducts = extractedProducts.filter(p => p.selected && !p.imported);
    
    if (selectedProducts.length === 0) {
      toast({
        title: 'Nenhum produto selecionado',
        description: 'Selecione pelo menos um produto para importar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingAll(true);

    let successCount = 0;
    for (let i = 0; i < extractedProducts.length; i++) {
      const product = extractedProducts[i];
      if (!product.selected || product.imported) continue;
      
      try {
        await importSingleProduct(i);
        successCount++;
      } catch (e) {
        console.error('Error importing product:', e);
      }
    }

    setIsSavingAll(false);

    toast({
      title: 'Importação concluída!',
      description: `${successCount} de ${selectedProducts.length} produtos importados.`,
    });
  };

  const selectedCount = extractedProducts.filter(p => p.selected && !p.imported).length;
  const importedCount = extractedProducts.filter(p => p.imported).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Extração de Produtos com IA</h1>
            <p className="text-muted-foreground">
              Extraia automaticamente dados de produtos de qualquer URL
            </p>
          </div>
        </div>

        {/* API Key Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🔑 Chave da API OpenAI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveApiKey} variant="secondary">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Sua chave é salva apenas localmente no seu navegador. 
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                Obter chave API
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Extraction Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Extrair Produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input Mode Selection */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => setInputMode('url')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'url' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Link className="h-4 w-4" />
                Via URL
              </button>
              <button
                onClick={() => setInputMode('html')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'html' 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code className="h-4 w-4" />
                Colar HTML
              </button>
            </div>

            <Tabs value={extractType} onValueChange={(v) => setExtractType(v as 'product' | 'store')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="product" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produto Único
                </TabsTrigger>
                <TabsTrigger value="store" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Loja/Listing
                </TabsTrigger>
              </TabsList>
              <TabsContent value="product" className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {inputMode === 'url' 
                    ? 'Cole a URL de uma página de produto para extrair nome, preço, descrição, especificações e imagens.'
                    : 'Cole o código HTML de uma página de produto (Ctrl+U no navegador).'}
                </p>
              </TabsContent>
              <TabsContent value="store" className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {inputMode === 'url' 
                    ? 'Cole a URL de uma página de loja para extrair múltiplos produtos.'
                    : 'Cole o código HTML de uma página de listagem para extrair múltiplos produtos.'}
                  <br />
                  {inputMode === 'url' && (
                    <span className="text-yellow-600">⚠️ Sites como Mercado Livre podem bloquear. Use "Colar HTML" nesses casos.</span>
                  )}
                  {inputMode === 'html' && (
                    <span className="text-green-600">✅ Modo HTML bypassa proteções anti-bot!</span>
                  )}
                </p>
              </TabsContent>
            </Tabs>

            {inputMode === 'url' ? (
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.exemplo.com/produto..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={extractProducts} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extraindo...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Extrair
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-400 font-medium mb-2">📋 Como copiar o HTML:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Abra a página do produto/loja no navegador</li>
                    <li>Pressione <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">Ctrl+U</kbd> (Windows) ou <kbd className="px-1 py-0.5 bg-secondary rounded text-xs">Cmd+Option+U</kbd> (Mac)</li>
                    <li>Selecione tudo (<kbd className="px-1 py-0.5 bg-secondary rounded text-xs">Ctrl+A</kbd>) e copie (<kbd className="px-1 py-0.5 bg-secondary rounded text-xs">Ctrl+C</kbd>)</li>
                    <li>Cole aqui abaixo</li>
                  </ol>
                </div>
                <textarea
                  placeholder="Cole o código HTML da página aqui..."
                  value={manualHtml}
                  onChange={(e) => setManualHtml(e.target.value)}
                  className="w-full h-32 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {manualHtml.length > 0 ? `${(manualHtml.length / 1024).toFixed(1)} KB de HTML` : 'Nenhum HTML colado'}
                  </span>
                  <Button onClick={extractProducts} disabled={isLoading || !manualHtml}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extraindo...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Extrair do HTML
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {extractedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-lg">
                  {extractedProducts.length} Produto{extractedProducts.length > 1 ? 's' : ''} Encontrado{extractedProducts.length > 1 ? 's' : ''}
                  {importedCount > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({importedCount} importado{importedCount > 1 ? 's' : ''})
                    </span>
                  )}
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {extractedProducts.length > 1 && (
                    <>
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        <Check className="h-4 w-4 mr-1" />
                        Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAll}>
                        <X className="h-4 w-4 mr-1" />
                        Nenhum
                      </Button>
                    </>
                  )}
                  <Button 
                    onClick={importSelectedProducts} 
                    disabled={isSavingAll || selectedCount === 0}
                  >
                    {isSavingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Importar Selecionados ({selectedCount})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {extractedProducts.map((product, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-all ${
                      product.imported 
                        ? 'border-green-500 bg-green-500/10 opacity-70'
                        : product.selected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="w-20 h-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                        {(product.image || product.images?.[0]) ? (
                          <img 
                            src={product.image || product.images?.[0]} 
                            alt={product.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23666" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{product.title}</h4>
                        {product.brand && (
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        )}
                        {product.price !== null && (
                          <p className="text-primary font-bold mt-1">
                            R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {!product.imported ? (
                        <>
                          <Button
                            variant={product.selected ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => toggleProductSelection(index)}
                          >
                            {product.selected ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Selecionado
                              </>
                            ) : (
                              'Selecionar'
                            )}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => importSingleProduct(index)}
                            disabled={product.importing}
                          >
                            {product.importing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <Check className="h-3 w-3 mr-1 text-green-500" />
                          Importado
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExtractProducts;
