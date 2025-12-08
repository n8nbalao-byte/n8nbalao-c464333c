import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, Check, Trash2, Package, Percent, Tag, Link as LinkIcon, Globe, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getCustomCategories, addCustomCategory, CustomCategory } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from "xlsx";

interface ParsedProduct {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  costPrice: number;
  selected: boolean;
  detectedCategory?: string;
}

// Category detection keywords mapping
const categoryKeywords: Record<string, string[]> = {
  'notebook': ['notebook', 'laptop', 'macbook', 'chromebook', 'ultrabook'],
  'monitor': ['monitor', 'tela', 'display', 'led', 'lcd', 'ips', 'curvo'],
  'pc': ['desktop', 'computador', 'gabinete', 'pc gamer', 'workstation'],
  'processador': ['processador', 'cpu', 'intel', 'amd ryzen', 'core i'],
  'placa_mae': ['placa mãe', 'placa-mãe', 'motherboard', 'mainboard'],
  'memoria': ['memória ram', 'memoria ram', 'ddr4', 'ddr5', 'ram '],
  'armazenamento': ['ssd', 'hd ', 'hdd', 'nvme', 'm.2', 'disco rígido'],
  'gpu': ['placa de vídeo', 'placa de video', 'rtx', 'gtx', 'radeon', 'geforce'],
  'fonte': ['fonte', 'psu', 'power supply'],
  'cooler': ['cooler', 'water cooler', 'watercooler', 'ventilador', 'air cooler'],
  'gabinete': ['gabinete', 'case', 'torre'],
  'teclado': ['teclado', 'keyboard', 'mecânico'],
  'mouse': ['mouse', 'rato'],
  'headset': ['headset', 'fone', 'headphone', 'auricular'],
  'cadeira_gamer': ['cadeira', 'chair', 'gamer'],
  'acessorio': ['cabo', 'adaptador', 'hub', 'mousepad', 'webcam', 'microfone'],
  'software': ['software', 'windows', 'office', 'licença', 'antivírus'],
};

// Detect category from product title
const detectCategory = (title: string): string | undefined => {
  const lowerTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return undefined;
};

const ExtractProducts = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const [isLoadingFile, setIsLoadingFile] = useState(false);

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

  // Parse price from various formats
  const parsePrice = (priceText: string): number => {
    if (!priceText) return 0;
    const str = String(priceText).trim();
    
    // Remove currency symbols and spaces
    let cleaned = str.replace(/R\$\s*/gi, '').replace(/\s/g, '').trim();
    
    // Handle Brazilian format: 1.234,56 -> 1234.56
    if (cleaned.includes(',') && cleaned.includes('.')) {
      // Check if comma is decimal separator (Brazilian format)
      const lastComma = cleaned.lastIndexOf(',');
      const lastDot = cleaned.lastIndexOf('.');
      if (lastComma > lastDot) {
        // Brazilian format: 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // US format: 1,234.56
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes(',')) {
      // Only comma - could be decimal separator
      const parts = cleaned.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Decimal separator
        cleaned = cleaned.replace(',', '.');
      } else {
        // Thousand separator
        cleaned = cleaned.replace(/,/g, '');
      }
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Find best matching column for a field
  const findColumn = (headers: string[], patterns: string[]): number => {
    for (const pattern of patterns) {
      const lowerPattern = pattern.toLowerCase();
      for (let i = 0; i < headers.length; i++) {
        const header = String(headers[i] || '').toLowerCase().trim();
        if (header.includes(lowerPattern) || lowerPattern.includes(header)) {
          return i;
        }
      }
    }
    return -1;
  };

  // Import from Excel/CSV file (Instant Data Scraper format)
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingFile(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo não contém dados suficientes.",
          variant: "destructive"
        });
        return;
      }

      // Get headers (first row)
      const headers = jsonData[0].map(h => String(h || '').toLowerCase().trim());
      
      // Find columns by common patterns (Instant Data Scraper uses various names)
      const imagePatterns = ['image', 'imagem', 'foto', 'photo', 'img', 'picture', 'thumbnail', 'src'];
      const titlePatterns = ['title', 'titulo', 'título', 'nome', 'name', 'product', 'produto', 'description', 'descrição'];
      const pricePatterns = ['price', 'preço', 'preco', 'valor', 'value', 'à vista', 'a vista', 'avista', 'cash'];
      
      const imageCol = findColumn(headers, imagePatterns);
      const titleCol = findColumn(headers, titlePatterns);
      const priceCol = findColumn(headers, pricePatterns);
      
      if (titleCol === -1) {
        toast({
          title: "Colunas não encontradas",
          description: "Não foi possível identificar a coluna de nome/título do produto.",
          variant: "destructive"
        });
        return;
      }

      const products: ParsedProduct[] = [];
      
      // Process rows (skip header)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        const title = String(row[titleCol] || '').trim();
        if (!title) continue;
        
        const imageUrl = imageCol >= 0 ? String(row[imageCol] || '').trim() : '';
        const priceText = priceCol >= 0 ? String(row[priceCol] || '') : '';
        const costPrice = parsePrice(priceText);
        
        // Only add products with valid title
        if (title.length > 2) {
          products.push({
            id: crypto.randomUUID(),
            imageUrl,
            title,
            costPrice,
            selected: true,
            detectedCategory: detectCategory(title)
          });
        }
      }

      if (products.length === 0) {
        toast({
          title: "Nenhum produto encontrado",
          description: "Não foi possível extrair produtos do arquivo.",
          variant: "destructive"
        });
        return;
      }

      setParsedProducts(prev => [...prev, ...products]);
      
      toast({
        title: "Arquivo importado!",
        description: `${products.length} produtos extraídos do arquivo.`
      });
    } catch (error) {
      console.error('File import error:', error);
      toast({
        title: "Erro ao importar",
        description: "Não foi possível ler o arquivo. Verifique se é um arquivo Excel ou CSV válido.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Extract product from URL (using OpenAI API)
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
      // Usa o novo endpoint sem IA
      const response = await fetch('https://www.n8nbalao.com/api/extract-simple.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: extractUrl.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Falha na extração');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Falha na extração');
      }

      const productData = data.product;
      const title = productData.title || 'Produto sem nome';
      const product: ParsedProduct = {
        id: crypto.randomUUID(),
        imageUrl: productData.images?.[0] || '',
        title,
        description: productData.description || '',
        costPrice: parseFloat(productData.price) || 0,
        selected: true,
        detectedCategory: detectCategory(title)
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
        description: error instanceof Error ? error.message : "Não foi possível extrair. Use o Instant Data Scraper e importe o arquivo.",
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
          selected: true,
          detectedCategory: detectCategory(title)
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

  // Get icon for auto-created category
  const getCategoryIcon = (categoryKey: string): string => {
    const iconMap: Record<string, string> = {
      'notebook': 'Laptop',
      'monitor': 'Monitor',
      'pc': 'Monitor',
      'processador': 'Cpu',
      'placa_mae': 'CircuitBoard',
      'memoria': 'MemoryStick',
      'armazenamento': 'HardDrive',
      'gpu': 'Tv',
      'fonte': 'Zap',
      'cooler': 'Fan',
      'gabinete': 'Box',
      'teclado': 'Keyboard',
      'mouse': 'Mouse',
      'headset': 'Headphones',
      'cadeira_gamer': 'Armchair',
      'acessorio': 'Cable',
      'software': 'AppWindow',
    };
    return iconMap[categoryKey] || 'Package';
  };

  // Format category label
  const formatCategoryLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const importProducts = async () => {
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
    const createdCategories = new Set<string>();

    // Pre-create any missing categories
    const existingCategoryKeys = categories.map(c => c.key);
    const neededCategories = new Set<string>();
    
    for (const product of toImport) {
      const fallbackCat = (category && category !== '_auto') ? category : ((productType && productType !== '_auto') ? productType : 'outro');
      const cat = product.detectedCategory || fallbackCat;
      if (cat && !existingCategoryKeys.includes(cat)) {
        neededCategories.add(cat);
      }
    }

    // Create missing categories
    for (const catKey of neededCategories) {
      try {
        const label = formatCategoryLabel(catKey);
        const icon = getCategoryIcon(catKey);
        await addCustomCategory(catKey, label, icon);
        createdCategories.add(catKey);
      } catch (error) {
        console.error('Error creating category:', catKey, error);
      }
    }

    // Import products
    for (let i = 0; i < toImport.length; i++) {
      const product = toImport[i];
      setImportProgress({ current: i + 1, total: toImport.length });

      try {
        const finalPrice = calculateFinalPrice(product.costPrice);
        const media = product.imageUrl ? [{ type: 'image' as const, url: product.imageUrl }] : [];
        
        // Use detected category, fallback to selected category, productType, or 'outro'
        const fallbackCategory = (category && category !== '_auto') ? category : ((productType && productType !== '_auto') ? productType : 'outro');
        const productCategory = product.detectedCategory || fallbackCategory;
        const productTypeValue = product.detectedCategory || ((productType && productType !== '_auto') ? productType : fallbackCategory);

        await api.createProduct({
          title: product.title,
          subtitle: '',
          description: product.description || '',
          productType: productTypeValue as any,
          categories: [productCategory],
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
    
    // Reload categories to include newly created ones
    if (createdCategories.size > 0) {
      await loadCategories();
    }

    const categoryMsg = createdCategories.size > 0 
      ? `. ${createdCategories.size} categoria(s) criada(s) automaticamente` 
      : '';

    toast({
      title: "Importação concluída",
      description: `${successCount} produtos importados${errorCount > 0 ? `, ${errorCount} erros` : ''}${categoryMsg}.`
    });
  };

  const totalCost = parsedProducts.filter(p => p.selected).reduce((sum, p) => sum + p.costPrice, 0);
  const totalSale = parsedProducts.filter(p => p.selected).reduce((sum, p) => sum + calculateFinalPrice(p.costPrice), 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      
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
            <Tabs defaultValue="scraper" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="scraper" className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Instant Data Scraper
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Extrair por URL
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Dados Manuais
                </TabsTrigger>
              </TabsList>
              
              {/* Instant Data Scraper Import */}
              <TabsContent value="scraper" className="space-y-4">
                <div className="p-6 border-2 border-dashed rounded-lg text-center" style={{ borderColor: '#DC2626' }}>
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4" style={{ color: '#DC2626' }} />
                  <h3 className="font-semibold text-gray-800 mb-2">Importar do Instant Data Scraper</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Use a extensão Instant Data Scraper, exporte para Excel ou CSV, e importe aqui.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoadingFile}
                    style={{ backgroundColor: '#DC2626' }}
                    className="text-white hover:opacity-90"
                  >
                    {isLoadingFile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Arquivo Excel/CSV
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Como usar:</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Instale a extensão "Instant Data Scraper" no Chrome</li>
                    <li>Acesse a página de produtos que deseja extrair</li>
                    <li>Clique no ícone da extensão e aguarde a detecção automática</li>
                    <li>Clique em "Export to Excel" ou "Export to CSV"</li>
                    <li>Importe o arquivo aqui</li>
                  </ol>
                  <p className="text-xs text-gray-500 mt-3">
                    O sistema detecta automaticamente as colunas de imagem, nome e preço.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={extractUrl}
                    onChange={(e) => setExtractUrl(e.target.value)}
                    placeholder="Cole a URL do produto (ex: https://www.kabum.com.br/produto/...)"
                    className="flex-1 border-2 bg-white text-gray-800 placeholder:text-gray-400"
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
                  Extração direta por URL. Se falhar, use o Instant Data Scraper.
                </p>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <Textarea
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="Cole aqui os dados do scraper (formato tab-separated: imagem, nome, preço)"
                  className="min-h-[200px] font-mono text-xs border-2 bg-white text-gray-800 placeholder:text-gray-400"
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
              <p className="text-sm text-gray-500 mt-1">
                As categorias são detectadas automaticamente pelo nome do produto. Categorias não existentes serão criadas automaticamente.
              </p>
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
                  className="border-2 bg-white text-gray-800"
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
                  className="border-2 bg-white text-gray-800"
                  style={{ borderColor: '#E5E7EB' }}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700">
                  <Tag className="h-4 w-4" />
                  Tipo Padrão (opcional)
                </Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger className="border-2 bg-white text-gray-800" style={{ borderColor: '#E5E7EB' }}>
                    <SelectValue placeholder="Auto-detectado" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="_auto" className="text-gray-500 italic">
                      Auto-detectado
                    </SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.key} value={cat.key} className="text-gray-800">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Usado quando não detectado</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-gray-700">
                  <Package className="h-4 w-4" />
                  Categoria Padrão (opcional)
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="border-2 bg-white text-gray-800" style={{ borderColor: '#E5E7EB' }}>
                    <SelectValue placeholder="Auto-detectada" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="_auto" className="text-gray-500 italic">
                      Auto-detectada
                    </SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.key} value={cat.key} className="text-gray-800">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Usado quando não detectada</p>
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
                      <TableHead>Categoria Detectada</TableHead>
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
                        <TableCell>
                          {product.detectedCategory ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {formatCategoryLabel(product.detectedCategory)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                              {category ? formatCategoryLabel(category) : 'Sem categoria'}
                            </span>
                          )}
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
                disabled={isImporting || selectedCount === 0}
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