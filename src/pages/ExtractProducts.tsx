import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, Check, Trash2, Package, Percent, Tag
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, getCustomCategories, CustomCategory } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ParsedProduct {
  id: string;
  imageUrl: string;
  title: string;
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
      if (!line || line.startsWith('imageCard')) continue; // Skip header

      // Split by tab
      const parts = line.split('\t');
      if (parts.length < 3) continue;

      const imageUrl = parts[0]?.trim() || '';
      const title = parts[1]?.trim() || '';
      const priceText = parts[2]?.trim() || '';

      // Parse price: "R$ 1.000,00" -> 1000.00
      const priceMatch = priceText.match(/R\$\s*([\d.,]+)/);
      let costPrice = 0;
      if (priceMatch) {
        costPrice = parseFloat(
          priceMatch[1]
            .replace(/\./g, '') // Remove thousand separators
            .replace(',', '.') // Convert decimal separator
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

    setParsedProducts(products);
    toast({
      title: "Produtos carregados",
      description: `${products.length} produtos encontrados.`
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
          description: '',
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
    
    // Remove imported products from list
    setParsedProducts(prev => prev.filter(p => !p.selected));

    toast({
      title: "Importação concluída",
      description: `${successCount} produtos importados${errorCount > 0 ? `, ${errorCount} erros` : ''}.`
    });
  };

  const totalCost = parsedProducts.filter(p => p.selected).reduce((sum, p) => sum + p.costPrice, 0);
  const totalSale = parsedProducts.filter(p => p.selected).reduce((sum, p) => sum + calculateFinalPrice(p.costPrice), 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Importar Produtos em Massa</h1>
            <p className="text-muted-foreground">Cole os dados do scraper para importar múltiplos produtos</p>
          </div>
        </div>

        {/* Data Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dados do Scraper
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder={`Cole aqui os dados do scraper (formato tab-separated):
imageCard src	titulo	preço	...
https://images.kabum.com.br/...	Gift Card KaBuM: 1.000 Reais	R$ 1.000,00	...`}
              className="min-h-[200px] font-mono text-xs"
            />
            <Button onClick={parseScraperData} className="w-full">
              <Package className="h-4 w-4 mr-2" />
              Carregar Produtos
            </Button>
          </CardContent>
        </Card>

        {/* Configuration */}
        {parsedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuração da Importação</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
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
                />
                <p className="text-xs text-muted-foreground">Aplicada sobre o custo</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
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
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tipo do Produto
                </Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger>
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
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Categoria
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Produtos ({parsedProducts.length})</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAll(true)}
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAll(false)}
                  >
                    Desmarcar Todos
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                              className="w-12 h-12 object-contain rounded bg-muted"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={product.title}>
                          {product.title}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          R$ {product.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right text-orange-500">
                          R$ {calculateAdjustedCost(product.costPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right font-medium text-primary">
                          R$ {calculateFinalPrice(product.costPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
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
              <div className="mt-4 p-4 bg-muted/50 rounded-lg flex flex-wrap gap-6 justify-between items-center">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Selecionados</p>
                  <p className="text-xl font-bold">{selectedCount} produtos</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Custo</p>
                  <p className="text-xl font-bold">
                    R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Venda (+{margin}%)</p>
                  <p className="text-xl font-bold text-primary">
                    R$ {totalSale.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Lucro Estimado</p>
                  <p className="text-xl font-bold text-green-500">
                    R$ {(totalSale - totalCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Import Button */}
              <Button
                onClick={importProducts}
                disabled={isImporting || selectedCount === 0 || !productType || !category}
                className="w-full mt-4"
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
