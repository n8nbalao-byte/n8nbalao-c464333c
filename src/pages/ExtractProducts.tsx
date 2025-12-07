import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Package, Store, Loader2, Check, X, Download, Eye, Save } from 'lucide-react';
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
}

const API_BASE_URL = 'https://n8nbalao.com/api';

const ExtractProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '');
  const [url, setUrl] = useState('');
  const [extractType, setExtractType] = useState<'product' | 'store'>('product');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedProduct | ExtractedProduct[] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

    if (!url) {
      toast({
        title: 'URL necessária',
        description: 'Por favor, insira a URL do produto ou loja.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setExtractedData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/extract.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          apiKey,
          extractType,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao extrair dados');
      }

      if (result.type === 'store' && Array.isArray(result.data)) {
        // Mark all products as selected by default
        setExtractedData(result.data.map((p: ExtractedProduct) => ({ ...p, selected: true })));
      } else {
        setExtractedData(result.data);
      }

      toast({
        title: 'Extração concluída!',
        description: result.type === 'store' 
          ? `${result.count} produtos encontrados.`
          : 'Dados do produto extraídos com sucesso.',
      });
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
    if (Array.isArray(extractedData)) {
      const updated = [...extractedData];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      setExtractedData(updated);
    }
  };

  const selectAll = () => {
    if (Array.isArray(extractedData)) {
      setExtractedData(extractedData.map(p => ({ ...p, selected: true })));
    }
  };

  const deselectAll = () => {
    if (Array.isArray(extractedData)) {
      setExtractedData(extractedData.map(p => ({ ...p, selected: false })));
    }
  };

  const importProducts = async () => {
    setIsSaving(true);

    try {
      if (Array.isArray(extractedData)) {
        // Import multiple products
        const selectedProducts = extractedData.filter(p => p.selected);
        
        if (selectedProducts.length === 0) {
          toast({
            title: 'Nenhum produto selecionado',
            description: 'Selecione pelo menos um produto para importar.',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }

        let successCount = 0;
        for (const product of selectedProducts) {
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
            
            // Determine category from extracted data
            const category = product.category || 'acessorio';
            
            await api.createProduct({
              title: product.title || 'Produto Importado',
              subtitle: product.brand || '',
              categories: [category],
              productType: category as any,
              media: product.image ? [{ type: 'image', url: product.image }] : 
                     product.images?.[0] ? [{ type: 'image', url: product.images[0] }] : [],
              specs: specsRecord,
              components: {},
              totalPrice: product.price || 0,
            });
            successCount++;
          } catch (e) {
            console.error('Error importing product:', e);
          }
        }

        toast({
          title: 'Importação concluída!',
          description: `${successCount} de ${selectedProducts.length} produtos importados.`,
        });
      } else if (extractedData) {
        // Import single product
        // Handle specs - could be array or object
        let specsRecord: Record<string, string> = {};
        if (extractedData.specs) {
          if (Array.isArray(extractedData.specs)) {
            extractedData.specs.forEach((spec, idx) => {
              specsRecord[`spec_${idx + 1}`] = spec;
            });
          } else {
            specsRecord = extractedData.specs as Record<string, string>;
          }
        }
        
        // Determine category from extracted data
        const category = extractedData.category || 'acessorio';
        
        await api.createProduct({
          title: extractedData.title || 'Produto Importado',
          subtitle: extractedData.brand || '',
          categories: [category],
          productType: category as any,
          media: extractedData.images?.map(url => ({ type: 'image' as const, url })) || [],
          specs: specsRecord,
          components: {},
          totalPrice: extractedData.price || 0,
        });

        toast({
          title: 'Produto importado!',
          description: 'O produto foi adicionado ao catálogo.',
        });
      }

      setExtractedData(null);
      setUrl('');
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Erro ao importar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
                  Cole a URL de uma página de produto para extrair nome, preço, descrição, especificações e imagens.
                </p>
              </TabsContent>
              <TabsContent value="store" className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Cole a URL de uma página de loja ou listagem para extrair múltiplos produtos de uma vez.
                </p>
              </TabsContent>
            </Tabs>

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
          </CardContent>
        </Card>

        {/* Results Section */}
        {extractedData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {Array.isArray(extractedData) 
                    ? `${extractedData.length} Produtos Encontrados`
                    : 'Produto Extraído'
                  }
                </CardTitle>
                <div className="flex gap-2">
                  {Array.isArray(extractedData) && (
                    <>
                      <Button variant="outline" size="sm" onClick={selectAll}>
                        <Check className="h-4 w-4 mr-1" />
                        Selecionar Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAll}>
                        <X className="h-4 w-4 mr-1" />
                        Limpar Seleção
                      </Button>
                    </>
                  )}
                  <Button onClick={importProducts} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Importar {Array.isArray(extractedData) 
                          ? `(${extractedData.filter(p => p.selected).length})`
                          : ''
                        }
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {Array.isArray(extractedData) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {extractedData.map((product, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        product.selected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => toggleProductSelection(index)}
                    >
                      <div className="flex gap-3">
                        {product.image && (
                          <img 
                            src={product.image} 
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{product.title}</h4>
                          {product.price && (
                            <p className="text-primary font-bold mt-1">
                              R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          product.selected ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {product.selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    {extractedData.images?.[0] && (
                      <img 
                        src={extractedData.images[0]} 
                        alt={extractedData.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{extractedData.title}</h3>
                      {extractedData.brand && (
                        <p className="text-muted-foreground">{extractedData.brand} {extractedData.model}</p>
                      )}
                      {extractedData.price && (
                        <p className="text-2xl font-bold text-primary mt-2">
                          R$ {extractedData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {extractedData.description && (
                    <div>
                      <h4 className="font-semibold mb-1">Descrição</h4>
                      <p className="text-muted-foreground text-sm">{extractedData.description}</p>
                    </div>
                  )}
                  
                  {extractedData.specs && Object.keys(extractedData.specs).length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-1">Especificações</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {Array.isArray(extractedData.specs) 
                          ? extractedData.specs.map((spec, i) => (
                              <li key={i}>{spec}</li>
                            ))
                          : Object.entries(extractedData.specs).map(([key, value], i) => (
                              <li key={i}><strong>{key}:</strong> {value}</li>
                            ))
                        }
                      </ul>
                    </div>
                  )}

                  {extractedData.images && extractedData.images.length > 1 && (
                    <div>
                      <h4 className="font-semibold mb-2">Imagens ({extractedData.images.length})</h4>
                      <div className="flex gap-2 flex-wrap">
                        {extractedData.images.map((img, i) => (
                          <img 
                            key={i}
                            src={img}
                            alt={`Imagem ${i + 1}`}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExtractProducts;
