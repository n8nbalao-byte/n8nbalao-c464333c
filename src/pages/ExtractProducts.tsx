import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, Check, Trash2, Package, Percent, Tag, Link as LinkIcon, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getCustomCategories, CustomCategory } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RedWhiteHeader } from "@/components/RedWhiteHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ParsedProduct {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  costPrice: number;
  selected: boolean;
}

const ExtractProducts = () => {
  const { toast } = useToast();
  
  const [rawData, setRawData] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [taxa, setTaxa] = useState('0');
  const [margin, setMargin] = useState('30');
  const [productType, setProductType] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // URL extraction states
  const [extractUrl, setExtractUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await getCustomCategories();
    setCategories(cats);
    if (cats.length > 0 && !productType) {
      setProductType(cats[0].key);
      setCategory(cats[0].key);
    }
  };

  // Extract product from URL
  const extractFromUrl = async () => {
    if (!extractUrl.trim()) {
      toast({
        title: "URL necessária",
        description: "Digite a URL do produto para extrair.",
        variant: "destructive"
      });
      return;
    }

    setIsExtracting(true);
    
    try {
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        toast({
          title: "Chave OpenAI necessária",
          description: "Configure sua chave da OpenAI nas configurações.",
          variant: "destructive"
        });
        setIsExtracting(false);
        return;
      }

      const response = await fetch('https://www.n8nbalao.com/api/extract.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          url: extractUrl.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Falha na extração');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add extracted product to list
      const product: ParsedProduct = {
        id: crypto.randomUUID(),
        imageUrl: data.images?.[0] || '',
        title: data.title || 'Produto sem nome',
        description: data.description || '',
        costPrice: parseFloat(data.price) || 0,
        selected: true
      };

      setParsedProducts(prev => [...prev, product]);
      setExtractUrl('');
      
      toast({
        title: "Produto extraído!",
        description: `${product.title} foi adicionado à lista.`
      });
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Erro na extração",
        description: error instanceof Error ? error.message : "Não foi possível extrair o produto. Tente usar o modo manual.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const parseScraperData = () => {
    if (!rawData.trim()) {
      toast({
        title: "Dados necessários",
        description: "Cole os dados do scraper na área de texto.",
        variant: "destructive"
      });
      return;
    }

    const lines = rawData.trim().split('\n');
    const products: ParsedProduct[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('imageCard')) continue;

      const parts = line.split('\t');
      if (parts.length < 3) continue;

      const imageUrl = parts[0]?.trim() || '';
      const title = parts[1]?.trim() || '';
      const priceText = parts[2]?.trim() || '';

      const priceMatch = priceText.match(/R\$\s*([\d.,]+)/);
      let costPrice = 0;
      if (priceMatch) {
        costPrice = parseFloat(
          priceMatch[1]
            .replace(/\./g, '')
            .replace(',', '.')
        );
      }

      if (title && costPrice > 0) {
        products.push({
          id: crypto.randomUUID(),
          imageUrl,
          title,
          costPrice,
          selected: true
        });
      }
    }

    if (products.length === 0) {
      toast({
        title: "Nenhum produto encontrado",
        description: "Verifique se os dados estão no formato correto.",
        variant: "destructive"
      });
      return;
    }

    setParsedProducts(prev => [...prev, ...products]);
    setRawData('');
    toast({
      title: "Produtos carregados",
      description: `${products.length} produtos adicionados.`
    });
  };

  const calculateAdjustedCost = (costPrice: number) => {
    const taxaPercent = parseFloat(taxa) || 0;
    return costPrice * (1 + taxaPercent / 100);
  };

  const calculateFinalPrice = (costPrice: number) => {
    const adjustedCost = calculateAdjustedCost(costPrice);
    const marginPercent = parseFloat(margin) || 0;
    return adjustedCost * (1 + marginPercent / 100);
  };

  const toggleProduct = (id: string) => {
    setParsedProducts(prev => 
      prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p)
    );
  };

  const toggleAll = (selected: boolean) => {
    setParsedProducts(prev => prev.map(p => ({ ...p, selected })));
  };

  const removeProduct = (id: string) => {
    setParsedProducts(prev => prev.filter(p => p.id !== id));
  };

  const selectedCount = parsedProducts.filter(p => p.selected).length;

  const importProducts = async () => {
    if (!productType || !category) {
      toast({
        title: "Configuração necessária",
        description: "Selecione o tipo e categoria dos produtos.",
        variant: "destructive"
      });
      return;
    }

    const toImport = parsedProducts.filter(p => p.selected);
    if (toImport.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: toImport.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < toImport.length; i++) {
      const product = toImport[i];
      setImportProgress({ current: i + 1, total: toImport.length });

      try {
        const finalPrice = calculateFinalPrice(product.costPrice);
        
        const media = product.imageUrl ? [{ type: 'image' as const, url: product.imageUrl }] : [];

        await api.createProduct({
          title: product.title,
          subtitle: '',
          description: product.description || '',
          productType: productType as any,
          categories: [category],
          media,
          specs: {},
          totalPrice: Math.round(finalPrice * 100) / 100,
          components: {},
          downloadUrl: ''
        });

        successCount++;
      } catch (error) {
        console.error('Error importing product:', error);
        errorCount++;
      }
    }

    setIsImporting(false);
    setParsedProducts(prev => prev.filter(p => !p.selected));

    toast({
      title: "Importação concluída",
      description: `${successCount} produtos importados${errorCount > 0 ? `, ${errorCount} erros` : ''}.`
    });
  };

  const totalCost = parsedProducts.filter(p => p.selected).reduce((sum, p) => sum + p.costPrice, 0);
  const totalSale = parsedProducts.filter(p => p.selected).reduce((sum, p) => sum + calculateFinalPrice(p.costPrice), 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEF2F2' }}>
      <RedWhiteHeader hideCart />
      
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="outline" size="icon" className="border-2" style={{ borderColor: '#DC2626', color: '#DC2626' }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#DC2626' }}>Importar Produtos em Massa</h1>
            <p className="text-gray-600">Extraia produtos de URLs ou cole dados manualmente</p>
          </div>
        </div>

        {/* Data Input Tabs */}
        <Card className="border-2 bg-white" style={{ borderColor: '#E5E7EB' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#DC2626' }}>
              <Upload className="h-5 w-5" />
              Adicionar Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Extrair por URL
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Dados Manuais
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={extractUrl}
                    onChange={(e) => setExtractUrl(e.target.value)}
                    placeholder="Cole a URL do produto (ex: https://www.kabum.com.br/produto/...)"
                    className="flex-1 border-2"
                    style={{ borderColor: '#E5E7EB' }}
                  />
                  <Button 
                    onClick={extractFromUrl}
                    disabled={isExtracting}
                    style={{ backgroundColor: '#DC2626' }}
                    className="text-white hover:opacity-90"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Extraindo...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Extrair
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Cole a URL de um produto de lojas como Kabum, Pichau, Mercado Livre, etc.
                  O sistema extrairá automaticamente: foto, nome, descrição e preço à vista.
                </p>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <Textarea
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Cole aqui os dados do scraper (formato tab-separated: imagem, nome, preço)"
                  className="min-h-[200px] font-mono text-xs border-2"
                  style={{ borderColor: '#E5E7EB' }}
                />
                <Button 
                  onClick={parseScraperData} 
                  className="w-full text-white hover:opacity-90"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Carregar Produtos
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Configuration */}
        {parsedProducts.length > 0 && (
          <Card className="border-2 bg-white" style={{ borderColor: '#E5E7EB' }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#DC2626' }}>Configuração da Importação</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700">
                  <Percent className="h-4 w-4" />
                  Taxa (%)
                </Label>
                <Input
                  type="number"
                  value={taxa}
                  onChange={(e) => setTaxa(e.target.value)}
                  placeholder="0"
                  min="0"
                  max="100"
                  className="border-2"
                  style={{ borderColor: '#E5E7EB' }}
                />
                <p className="text-xs text-gray-500">Aplicada sobre o custo</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700">
                  <Percent className="h-4 w-4" />
                  Margem de Lucro (%)
                </Label>
                <Input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  placeholder="30"
                  min="0"
                  max="500"
                  className="border-2"
                  style={{ borderColor: '#E5E7EB' }}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700">
                  <Tag className="h-4 w-4" />
                  Tipo do Produto
                </Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger className="border-2" style={{ borderColor: '#E5E7EB' }}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700">
                  <Package className="h-4 w-4" />
                  Categoria
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-2" style={{ borderColor: '#E5E7EB' }}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        {parsedProducts.length > 0 && (
          <Card className="border-2 bg-white" style={{ borderColor: '#E5E7EB' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between" style={{ color: '#DC2626' }}>
                <span>Produtos ({parsedProducts.length})</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAll(true)}
                    className="border-2"
                    style={{ borderColor: '#DC2626', color: '#DC2626' }}
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAll(false)}
                    className="border-2"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    Desmarcar Todos
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border-2 overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedCount === parsedProducts.length}
                          onCheckedChange={(checked) => toggleAll(!!checked)}
                        />
                      </TableHead>
                      <TableHead className="w-16">Imagem</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Custo Ajustado (+{taxa}%)</TableHead>
                      <TableHead className="text-right">Venda (+{margin}%)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedProducts.map((product) => (
                      <TableRow key={product.id} className={!product.selected ? 'opacity-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={product.selected}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="w-12 h-12 object-contain rounded bg-gray-100"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-gray-800" title={product.title}>
                          {product.title}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          R$ {product.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-orange-500">
                          R$ {calculateAdjustedCost(product.costPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium" style={{ color: '#DC2626' }}>
                          R$ {calculateFinalPrice(product.costPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => removeProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg flex flex-wrap gap-6 justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Selecionados</p>
                  <p className="text-xl font-bold text-gray-800">{selectedCount} produtos</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Total Custo</p>
                  <p className="text-xl font-bold text-gray-800">
                    R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Total Venda (+{margin}%)</p>
                  <p className="text-xl font-bold" style={{ color: '#DC2626' }}>
                    R$ {totalSale.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Lucro Estimado</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {(totalSale - totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Import Button */}
              <Button
                onClick={importProducts}
                disabled={isImporting || selectedCount === 0 || !productType || !category}
                className="w-full mt-4 text-white hover:opacity-90"
                style={{ backgroundColor: '#DC2626' }}
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando {importProgress.current}/{importProgress.total}...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Importar {selectedCount} Produtos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExtractProducts;