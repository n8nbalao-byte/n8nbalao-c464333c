import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Link as LinkIcon, FileText, Loader2, Check, Plus, Save, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, getCustomCategories, addCustomCategory } from "@/lib/api";
import { getIconForCategoryName } from "@/lib/icons";

interface ExtractedProduct {
  title: string;
  price: number | null;
  description: string;
  brand: string;
  model: string;
  category: string;
  specs: Record<string, string>;
  images: string[];
  link: string;
  imported?: boolean;
  importing?: boolean;
}

const ExtractProducts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [manualHtml, setManualHtml] = useState('');
  const [inputMode, setInputMode] = useState<'url' | 'html'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedProduct, setExtractedProduct] = useState<ExtractedProduct | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    toast({
      title: "API Key salva",
      description: "Sua chave OpenAI foi salva localmente."
    });
  };

  const extractProduct = async () => {
    if (!apiKey) {
      toast({
        title: "API Key necessária",
        description: "Configure sua chave OpenAI primeiro.",
        variant: "destructive"
      });
      return;
    }

    if (inputMode === 'url' && !inputUrl) {
      toast({
        title: "URL necessária",
        description: "Digite a URL do produto.",
        variant: "destructive"
      });
      return;
    }

    if (inputMode === 'html' && !manualHtml) {
      toast({
        title: "HTML necessário",
        description: "Cole o código HTML da página.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setExtractedProduct(null);

    try {
      const response = await fetch('https://www.n8nbalao.com/api/extract.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          url: inputMode === 'url' ? inputUrl : '',
          manualHtml: inputMode === 'html' ? manualHtml : ''
        })
      });

      const data = await response.json();

      if (!data.success) {
        toast({
          title: "Erro na extração",
          description: data.error || "Não foi possível extrair o produto.",
          variant: "destructive"
        });
        return;
      }

      setExtractedProduct(data.product);
      toast({
        title: "Produto extraído",
        description: `"${data.product.title}" encontrado.`
      });

    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Erro",
        description: "Falha na conexão com o servidor.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importProduct = async () => {
    if (!extractedProduct) return;

    setExtractedProduct(prev => prev ? { ...prev, importing: true } : null);

    try {
      // Check if category exists, create if not
      const customCategories = await getCustomCategories();
      const categoryKey = extractedProduct.category?.toLowerCase().replace(/\s+/g, '_') || 'outros';
      
      // Check for existing category (match by key or label, case insensitive)
      const existingCategory = customCategories.find(
        cat => cat.key.toLowerCase() === categoryKey || 
               cat.label.toLowerCase() === extractedProduct.category?.toLowerCase()
      );

      let finalCategoryKey = categoryKey;
      
      if (existingCategory) {
        // Use existing category key
        finalCategoryKey = existingCategory.key;
      } else if (extractedProduct.category) {
        // Create new category with smart icon
        const categoryLabel = extractedProduct.category.charAt(0).toUpperCase() + extractedProduct.category.slice(1);
        const smartIcon = getIconForCategoryName(extractedProduct.category);
        await addCustomCategory(categoryKey, categoryLabel, smartIcon);
        finalCategoryKey = categoryKey;
      }

      // Prepare media from images
      const media = extractedProduct.images?.slice(0, 5).map(url => ({
        type: 'image' as const,
        url
      })) || [];

      // Prepare specs
      const specs: Record<string, string> = {};
      if (extractedProduct.specs) {
        Object.entries(extractedProduct.specs).forEach(([key, value]) => {
          if (value) specs[key] = String(value);
        });
      }

      await api.createProduct({
        title: extractedProduct.title || 'Produto Importado',
        subtitle: extractedProduct.brand ? `${extractedProduct.brand} ${extractedProduct.model || ''}`.trim() : '',
        description: extractedProduct.description || '',
        productType: finalCategoryKey as any,
        categories: [finalCategoryKey],
        media,
        specs,
        totalPrice: extractedProduct.price || 0,
        components: {},
        downloadUrl: ''
      });

      setExtractedProduct(prev => prev ? { ...prev, imported: true, importing: false } : null);

      toast({
        title: "Produto importado",
        description: `"${extractedProduct.title}" foi adicionado ao catálogo.`
      });

    } catch (error) {
      console.error('Import error:', error);
      setExtractedProduct(prev => prev ? { ...prev, importing: false } : null);
      toast({
        title: "Erro ao importar",
        description: "Não foi possível salvar o produto.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Extrair Produto</h1>
            <p className="text-muted-foreground">Extraia informações de produtos usando IA</p>
          </div>
        </div>

        {/* API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuração OpenAI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={saveApiKey} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Mode Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fonte dos Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={inputMode === 'url' ? 'default' : 'outline'}
                onClick={() => setInputMode('url')}
                className="flex-1"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                URL do Produto
              </Button>
              <Button
                variant={inputMode === 'html' ? 'default' : 'outline'}
                onClick={() => setInputMode('html')}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Colar HTML
              </Button>
            </div>

            {inputMode === 'url' ? (
              <div className="space-y-2">
                <Label>URL do Produto</Label>
                <Input
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.mercadolivre.com.br/produto..."
                />
                <p className="text-xs text-muted-foreground">
                  Cole a URL direta do produto. Para sites com proteção anti-bot, use "Colar HTML".
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Código HTML</Label>
                <Textarea
                  value={manualHtml}
                  onChange={(e) => setManualHtml(e.target.value)}
                  placeholder="Cole aqui o HTML da página (Ctrl+U no navegador)..."
                  className="min-h-[200px] font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Abra a página do produto, pressione Ctrl+U, copie todo o conteúdo e cole aqui.
                </p>
              </div>
            )}

            <Button 
              onClick={extractProduct} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Extrair Produto
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Extracted Product */}
        {extractedProduct && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Produto Extraído
                {extractedProduct.imported && (
                  <span className="text-sm text-green-500 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Importado
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {extractedProduct.images?.[0] && (
                  <img 
                    src={extractedProduct.images[0]} 
                    alt={extractedProduct.title}
                    className="w-32 h-32 object-contain rounded-lg bg-muted"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-lg">{extractedProduct.title}</h3>
                  {extractedProduct.brand && (
                    <p className="text-sm text-muted-foreground">
                      {extractedProduct.brand} {extractedProduct.model}
                    </p>
                  )}
                  {extractedProduct.price && (
                    <p className="text-xl font-bold text-primary">
                      R$ {extractedProduct.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                  {extractedProduct.category && (
                    <span className="inline-block px-2 py-1 bg-muted rounded text-xs">
                      {extractedProduct.category}
                    </span>
                  )}
                </div>
              </div>

              {extractedProduct.description && (
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {extractedProduct.description.substring(0, 300)}
                    {extractedProduct.description.length > 300 && '...'}
                  </p>
                </div>
              )}

              {extractedProduct.specs && Object.keys(extractedProduct.specs).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Especificações</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(extractedProduct.specs).slice(0, 6).map(([key, value]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted-foreground">{key}:</span>{' '}
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {extractedProduct.link && (
                <a 
                  href={extractedProduct.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline block"
                >
                  Ver produto original →
                </a>
              )}

              <Button
                onClick={importProduct}
                disabled={extractedProduct.imported || extractedProduct.importing}
                className="w-full"
              >
                {extractedProduct.importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : extractedProduct.imported ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Importado
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Importar Produto
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
