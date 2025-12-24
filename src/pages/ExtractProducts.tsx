import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Loader2, Check, Trash2, Package, Percent, Tag, Link as LinkIcon, Globe, FileSpreadsheet, Sparkles, Store, Wrench, ShoppingBag, Layers, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { api, getCustomCategories, addCustomCategory, getHardwareCategories, addHardwareCategory, CustomCategory, HardwareCategoryDef } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminFullPageLogin } from "@/components/AdminFullPageLogin";
import { checkAdminAuth } from "@/hooks/useAdminAuth";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as XLSX from "xlsx";

interface ParsedProduct {
  id: string;
  imageUrl: string;
  title: string;
  description?: string;
  simpleDescription?: string;
  fullDescription?: string;
  costPrice: number;
  selected: boolean;
  detectedCategory: string;
  isHardware: boolean;
  hardwareSubcategory?: string; // For hardware items: processor, motherboard, memory, etc.
}

// Hardware categories that should be imported as hardware items
// MUST match Admin panel keys: processor, motherboard, memory, storage, gpu, psu, cooler, case
const hardwareCategories = ['processor', 'motherboard', 'memory', 'storage', 'gpu', 'psu', 'cooler', 'case'];

// Category detection keywords mapping - ORDER MATTERS (more specific first)
// Keys MUST match Admin panel hardware categories for proper display
const categoryKeywords: Record<string, string[]> = {
  // Hardware - using Admin panel keys (processor, motherboard, memory, storage, gpu, psu, cooler, case)
  'processor': ['processador', 'intel core', 'amd ryzen', 'core i3', 'core i5', 'core i7', 'core i9', 'ryzen 3', 'ryzen 5', 'ryzen 7', 'ryzen 9', 'cpu'],
  'motherboard': ['placa mãe', 'placa-mãe', 'motherboard', 'mainboard', 'placa mae'],
  'memory': ['memória ram', 'memoria ram', 'pente de memória', 'ram 8gb', 'ram 16gb', 'ram 32gb', 'fury beast', 'hyperx fury', 'ddr4', 'ddr5'],
  'gpu': ['placa de vídeo', 'placa de video', 'rtx 3', 'rtx 4', 'gtx 1', 'radeon rx', 'geforce gtx', 'geforce rtx', 'graphics card'],
  'psu': ['fonte gamer', 'fonte 500w', 'fonte 600w', 'fonte 700w', 'fonte 750w', 'fonte 850w', 'power supply', 'psu', 'fonte atx'],
  'cooler': ['cooler', 'water cooler', 'watercooler', 'air cooler', 'refrigeração', 'ventoinha', 'fan rgb', 'fan 120mm', 'fan gamer'],
  'case': ['gabinete gamer', 'gabinete mid tower', 'gabinete atx', 'case gamer', 'mid tower', 'full tower', 'gabinete'],
  'storage': ['ssd sata', 'ssd nvme', 'hdd ', 'disco rígido', 'ssd 240', 'ssd 480', 'ssd 500', 'ssd 1tb', 'wd blue', 'seagate barracuda', 'armazenamento'],
  
  // Products
  'notebook': ['notebook', 'laptop', 'macbook', 'chromebook', 'ultrabook'],
  'monitor': ['monitor gamer', 'monitor led', 'monitor ips', 'monitor curvo', 'monitor 24', 'monitor 27'],
  'pc': ['pc gamer', 'desktop gamer', 'computador gamer', 'workstation'],
  'teclado': ['teclado gamer', 'teclado mecânico', 'teclado rgb', 'keyboard'],
  'mouse': ['mouse gamer', 'mouse sem fio', 'mouse rgb'],
  'headset': ['headset gamer', 'headset rgb', 'fone gamer', 'headphone'],
  'cadeira_gamer': ['cadeira gamer', 'cadeira escritório', 'chair gamer'],
  'acessorio': ['cabo hdmi', 'cabo usb', 'adaptador', 'hub usb', 'mousepad', 'webcam', 'microfone', 'suporte'],
  'software': ['windows', 'office', 'licença', 'antivírus', 'software'],
};

// Icons for each category - matching Admin panel keys
const categoryIcons: Record<string, string> = {
  // Hardware (matching Admin keys)
  'processor': 'Cpu',
  'motherboard': 'CircuitBoard',
  'memory': 'MemoryStick',
  'storage': 'HardDrive',
  'gpu': 'Tv',
  'psu': 'Zap',
  'cooler': 'Fan',
  'case': 'Box',
  // Products
  'notebook': 'Laptop',
  'monitor': 'Monitor',
  'pc': 'Monitor',
  'teclado': 'Keyboard',
  'mouse': 'Mouse',
  'headset': 'Headphones',
  'cadeira_gamer': 'Armchair',
  'acessorio': 'Cable',
  'software': 'AppWindow',
  'outros': 'Package',
};

// Detect category from product title
const detectCategory = (title: string): { category: string; isHardware: boolean; hardwareSubcategory?: string } => {
  const lowerTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerTitle.includes(keyword.toLowerCase())) {
        const isHw = hardwareCategories.includes(category);
        return { 
          category, 
          isHardware: isHw,
          hardwareSubcategory: isHw ? category : undefined
        };
      }
    }
  }
  
  // Default to 'outros' when no category is detected
  return { category: 'outros', isHardware: false };
};

const ExtractProducts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
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
  
  // AI Description generation states
  const [storeText, setStoreText] = useState('');
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);
  const [descriptionProgress, setDescriptionProgress] = useState({ current: 0, total: 0 });
  const [lastGenerationUsage, setLastGenerationUsage] = useState<{
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUSD: number;
    costBRL: number;
  } | null>(null);
  
  // AI Title editing states
  const [isEditingTitles, setIsEditingTitles] = useState(false);
  const [titleEditProgress, setTitleEditProgress] = useState({ current: 0, total: 0 });

  // Check authentication on mount
  useEffect(() => {
    const isAuth = checkAdminAuth() || sessionStorage.getItem('admin_auth') === 'true';
    setIsAuthenticated(isAuth);
    if (!isAuth) {
      setShowLoginModal(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
    }
  }, [isAuthenticated]);

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

  // Universal parser: detect store format and extract image, title, price
  const parseUniversalRow = (row: any[], headers: string[]): { imageUrl: string; title: string; price: number } => {
    let imageUrl = '';
    let title = '';
    let price = 0;

    // Normalize headers for detection
    const headersJoined = headers.join(' ').toLowerCase();
    
    // Detect store format - more flexible detection
    const isMercadoLivre = headersJoined.includes('poly-component') || 
                          headersJoined.includes('andes-money') || 
                          headersJoined.includes('fraction') ||
                          headersJoined.includes('ui-search') ||
                          headersJoined.includes('shops__item');
    
    const isPichau = headersJoined.includes('mui-') || 
                    headersJoined.includes('muigrid') || 
                    headersJoined.includes('muitypography') ||
                    headersJoined.includes('pichau') ||
                    headersJoined.includes('jss');
    
    const isKalunga = headersJoined.includes('blocoproduto') || 
                     headersJoined.includes('kalunga') ||
                     headersJoined.includes('prateleira');
    
    const isKabum = headersJoined.includes('kabum') || 
                   headersJoined.includes('productcard') ||
                   (headersJoined.includes('restam') && headersJoined.includes('http'));

    console.log('Store detection:', { isMercadoLivre, isPichau, isKalunga, isKabum, headersSample: headers.slice(0, 5) });

    // ===== EXTRACT IMAGE =====
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      const value = String(row[i] || '').trim();
      
      // Skip placeholder/empty images
      if (value.startsWith('data:image/gif') || !value) continue;
      
      // Pichau: mui-*-media src or any media src
      if (isPichau && (header.includes('media') || header.includes('cardmedia')) && value.startsWith('http')) {
        imageUrl = value;
        break;
      }
      // Kalunga: blocoproduto__image src or img src
      if (isKalunga && (header.includes('blocoproduto__image') || header.includes('img')) && value.startsWith('http')) {
        imageUrl = value;
        break;
      }
      // Mercado Livre: poly-component image
      if (isMercadoLivre && (header.includes('image') || header.includes('picture')) && value.startsWith('http')) {
        imageUrl = value;
        break;
      }
      // General: any column with image/picture/src/foto and http URL
      if ((header.includes('picture') || header.includes('src') || header.includes('image') || 
           header.includes('img') || header.includes('foto') || header.includes('media') ||
           header.includes('thumbnail') || header.includes('photo')) 
          && value.startsWith('http')) {
        imageUrl = value;
        break;
      }
    }
    
    // Fallback: find any http URL that looks like an image
    if (!imageUrl) {
      for (const cell of row) {
        const value = String(cell || '').trim();
        if (value.startsWith('http') && 
            (value.includes('.webp') || value.includes('.jpg') || value.includes('.png') || 
             value.includes('.jpeg') || value.includes('/foto') || value.includes('/image') || 
             value.includes('/media') || value.includes('/img') || value.includes('produto'))) {
          imageUrl = value;
          break;
        }
      }
    }

    // ===== EXTRACT TITLE =====
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      const value = String(row[i] || '').trim();
      
      // Pichau: MuiTypography-root or product name
      if (isPichau && (header.includes('muitypography') || header.includes('name') || header.includes('title')) && value.length > 10) {
        title = value;
        break;
      }
      // Kalunga: blocoproduto__title or link text
      if (isKalunga && (header.includes('blocoproduto__title') || header.includes('titulo') || 
                        header.includes('link') || header.includes('name')) && value.length > 5) {
        title = value;
        break;
      }
      // Mercado Livre: poly-component title or ui-search title
      if (isMercadoLivre && (header.includes('title') || header.includes('heading') || 
                            header.includes('link')) && value.length > 10) {
        title = value;
        break;
      }
      // General: title/titulo/nome/name/produto
      if ((header.includes('title') || header.includes('titulo') || header.includes('nome') || 
           header.includes('name') || header.includes('produto') || header.includes('descri')) && value.length > 5) {
        title = value;
        break;
      }
    }
    
    // Fallback: use the longest text string that isn't a URL or price
    if (!title) {
      let maxLen = 0;
      for (const cell of row) {
        const value = String(cell || '').trim();
        // Must be text, not URL, not just a number, not a price
        if (value.length > maxLen && value.length > 10 && value.length < 500 &&
            !value.startsWith('http') && !value.startsWith('R$') && 
            !value.match(/^[\d.,]+$/) && !value.match(/^\d{1,2}x/)) {
          maxLen = value.length;
          title = value;
        }
      }
    }

    // ===== EXTRACT PRICE (À VISTA) =====
    
    // Pichau: mui-*-price_vista or price column
    if (isPichau) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase();
        if ((header.includes('price_vista') || header.includes('preco') || header.includes('price')) && 
            !header.includes('text') && !header.includes('old') && !header.includes('de_')) {
          const value = String(row[i] || '').trim();
          if (value.includes('R$') || value.match(/^\d/)) {
            price = parsePrice(value);
            if (price > 0) break;
          }
        }
      }
    }
    
    // Kalunga: blocoproduto__text or preco column
    if (isKalunga && price === 0) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase();
        if ((header.includes('blocoproduto__text') || header.includes('preco') || header.includes('price')) && 
            !header.includes('bold') && !header.includes('old') && !header.includes('de_')) {
          const value = String(row[i] || '').trim();
          if (value.includes('R$') || value.match(/^\d/)) {
            price = parsePrice(value);
            if (price > 0) break;
          }
        }
      }
    }
    
    // Kabum: direct price column with R$ (3rd column typically)
    if (isKabum && price === 0) {
      for (const cell of row) {
        const value = String(cell || '').trim();
        if (value.startsWith('R$') || (value.includes(',') && value.match(/^\d/))) {
          price = parsePrice(value);
          if (price > 0) break;
        }
      }
    }
    
    // Mercado Livre: split columns (R$ | integer | , | cents) or combined
    if (isMercadoLivre && price === 0) {
      let foundCurrency = false;
      let priceInteger = '';
      let priceCents = '';
      
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase();
        const value = String(row[i] || '').trim();
        
        // Check for combined price format first
        if ((header.includes('price') || header.includes('preco') || header.includes('money')) && 
            (value.includes('R$') || value.match(/^\d.*,\d{2}$/))) {
          const parsed = parsePrice(value);
          if (parsed > 0) {
            price = parsed;
            break;
          }
        }
        
        // Split format: First R$ is the main price (à vista)
        if (value === 'R$' && !foundCurrency) {
          foundCurrency = true;
          // Next column = integer part
          if (i + 1 < row.length) {
            const nextVal = String(row[i + 1] || '').trim();
            if (/^\d{1,3}(\.\d{3})*$/.test(nextVal) || /^\d+$/.test(nextVal)) {
              priceInteger = nextVal.replace(/\./g, '');
            }
          }
          // Look for cents nearby
          for (let j = i + 2; j < Math.min(i + 5, row.length); j++) {
            const checkVal = String(row[j] || '').trim();
            if (/^\d{1,2}$/.test(checkVal) && parseInt(checkVal) < 100) {
              priceCents = checkVal;
              break;
            }
          }
          break;
        }
        
        // Alternative: fraction 2 column
        if (header.includes('fraction') && !priceInteger) {
          const val = String(row[i] || '').trim();
          if (/^\d+$/.test(val)) priceInteger = val;
        }
        
        // Cents column
        if (header.includes('cents') && !priceCents) {
          const val = String(row[i] || '').trim();
          if (/^\d{1,2}$/.test(val)) priceCents = val;
        }
      }
      
      if (priceInteger && price === 0) {
        price = parseFloat(`${priceInteger}.${priceCents || '00'}`);
      }
    }
    
    // General fallback: find any value with R$ or number that looks like price
    if (price === 0) {
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase();
        const value = String(row[i] || '').trim();
        
        // Skip old/original prices
        if (header.includes('old') || header.includes('de_') || header.includes('original')) continue;
        
        if (value.includes('R$') || (value.match(/^\d/) && value.includes(','))) {
          const parsed = parsePrice(value);
          if (parsed > 0 && parsed < 500000) {
            price = parsed;
            break;
          }
        }
      }
    }
    
    // Last resort fallback
    if (price === 0) {
      for (const cell of row) {
        const value = String(cell || '').trim();
        if ((value.includes('R$') || value.match(/^\d.*,\d{2}$/)) && !value.includes('x de')) {
          const parsed = parsePrice(value);
          if (parsed > 0 && parsed < 500000) {
            price = parsed;
            break;
          }
        }
      }
    }

    console.log('Parsed row:', { imageUrl: imageUrl.substring(0, 50), title: title.substring(0, 50), price });

    return { imageUrl, title, price };
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
      
      const products: ParsedProduct[] = [];
      
      // Process rows (skip header) - use universal parser for ALL formats
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        // Universal parser handles Mercado Livre, Pichau, Kabum, Kalunga and others
        const parsed = parseUniversalRow(row, headers);
        let imageUrl = parsed.imageUrl;
        const title = parsed.title;
        const costPrice = parsed.price;
        
        // Skip rows without valid title
        if (!title || title.length < 3) continue;
        
        // Skip placeholder images
        if (imageUrl.startsWith('data:image/gif')) {
          imageUrl = '';
        }
        
        const detected = detectCategory(title);
        products.push({
          id: crypto.randomUUID(),
          imageUrl,
          title,
          costPrice,
          selected: true,
          detectedCategory: detected.category,
          isHardware: detected.isHardware,
          hardwareSubcategory: detected.hardwareSubcategory
        });
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
      const detected = detectCategory(title);
      const product: ParsedProduct = {
        id: crypto.randomUUID(),
        imageUrl: productData.images?.[0] || '',
        title,
        description: productData.description || '',
        costPrice: parseFloat(productData.price) || 0,
        selected: true,
        detectedCategory: detected.category,
        isHardware: detected.isHardware
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
        const detected = detectCategory(title);
        products.push({
          id: crypto.randomUUID(),
          imageUrl,
          title,
          costPrice,
          selected: true,
          detectedCategory: detected.category,
          isHardware: detected.isHardware
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

  // Get icon for category - uses categoryIcons map
  const getCategoryIcon = (categoryKey: string): string => {
    return categoryIcons[categoryKey] || 'Package';
  };

  // Format category label
  const formatCategoryLabel = (key: string): string => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Generate AI descriptions for all selected products
  const generateDescriptions = async () => {
    const toProcess = parsedProducts.filter(p => p.selected);
    if (toProcess.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para gerar descrições.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingDescriptions(true);
    setDescriptionProgress({ current: 0, total: toProcess.length });
    setLastGenerationUsage(null); // Reset usage before new generation

    try {
      // Process in batches of 5 to avoid timeout
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < toProcess.length; i += batchSize) {
        batches.push(toProcess.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const allResults: { id: string; simpleDescription: string; fullDescription: string }[] = [];

      for (const batch of batches) {
        const response = await fetch('https://www.n8nbalao.com/api/generate-descriptions.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: batch.map(p => ({ id: p.id, title: p.title })),
            storeText: storeText.trim()
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate descriptions');
        }

        const data = await response.json();
        
        if (data.success && data.results) {
          allResults.push(...data.results);
        }
        
        // Accumulate usage data from last batch
        if (data.usage) {
          setLastGenerationUsage(prev => ({
            model: data.usage.model,
            inputTokens: (prev?.inputTokens || 0) + data.usage.inputTokens,
            outputTokens: (prev?.outputTokens || 0) + data.usage.outputTokens,
            totalTokens: (prev?.totalTokens || 0) + data.usage.totalTokens,
            costUSD: (prev?.costUSD || 0) + data.usage.costUSD,
            costBRL: (prev?.costBRL || 0) + data.usage.costBRL,
          }));
        }

        processedCount += batch.length;
        setDescriptionProgress({ current: processedCount, total: toProcess.length });
      }

      // Update products with generated descriptions
      setParsedProducts(prev => prev.map(product => {
        const result = allResults.find(r => r.id === product.id);
        if (result) {
          return {
            ...product,
            simpleDescription: result.simpleDescription || '',
            fullDescription: result.fullDescription || '',
            description: result.fullDescription || result.simpleDescription || ''
          };
        }
        return product;
      }));

      toast({
        title: "Descrições geradas!",
        description: `${allResults.length} descrições criadas com IA.`
      });
    } catch (error) {
      console.error('Error generating descriptions:', error);
      toast({
        title: "Erro ao gerar descrições",
        description: "Verifique se a API key do OpenAI está configurada em Admin > Configurações.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingDescriptions(false);
      setDescriptionProgress({ current: 0, total: 0 });
    }
  };

  // Edit titles with AI - simplify and clean up product names
  const editTitlesWithAI = async () => {
    const toProcess = parsedProducts.filter(p => p.selected);
    if (toProcess.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Selecione pelo menos um produto para editar títulos.",
        variant: "destructive"
      });
      return;
    }

    setIsEditingTitles(true);
    setTitleEditProgress({ current: 0, total: toProcess.length });

    try {
      // Process in batches of 10
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < toProcess.length; i += batchSize) {
        batches.push(toProcess.slice(i, i + batchSize));
      }

      let processedCount = 0;
      const allResults: { id: string; newTitle: string }[] = [];

      for (const batch of batches) {
        const response = await fetch('https://www.n8nbalao.com/api/edit-titles.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: batch.map(p => ({ id: p.id, title: p.title }))
          })
        });

        if (!response.ok) {
          throw new Error('Failed to edit titles');
        }

        const data = await response.json();
        
        if (data.success && data.results) {
          allResults.push(...data.results);
        }
        
        // Accumulate usage data
        if (data.usage) {
          setLastGenerationUsage(prev => ({
            model: data.usage.model,
            inputTokens: (prev?.inputTokens || 0) + data.usage.inputTokens,
            outputTokens: (prev?.outputTokens || 0) + data.usage.outputTokens,
            totalTokens: (prev?.totalTokens || 0) + data.usage.totalTokens,
            costUSD: (prev?.costUSD || 0) + data.usage.costUSD,
            costBRL: (prev?.costBRL || 0) + data.usage.costBRL,
          }));
        }

        processedCount += batch.length;
        setTitleEditProgress({ current: processedCount, total: toProcess.length });
      }

      // Update products with edited titles
      setParsedProducts(prev => prev.map(product => {
        const result = allResults.find(r => r.id === product.id);
        if (result && result.newTitle) {
          return { ...product, title: result.newTitle };
        }
        return product;
      }));

      toast({
        title: "Títulos editados!",
        description: `${allResults.length} títulos simplificados com IA.`
      });
    } catch (error) {
      console.error('Error editing titles:', error);
      toast({
        title: "Erro ao editar títulos",
        description: "Verifique se a API key do OpenAI está configurada em Admin > Configurações.",
        variant: "destructive"
      });
    } finally {
      setIsEditingTitles(false);
      setTitleEditProgress({ current: 0, total: 0 });
    }
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
    const createdHardwareCategories = new Set<string>();
    let hardwareCount = 0;
    let productCount = 0;

    // Separate hardware and products
    const hardwareItems = toImport.filter(p => p.isHardware);
    const productItems = toImport.filter(p => !p.isHardware);

    // Pre-create any missing product categories
    const existingCategoryKeys = categories.map(c => c.key);
    const neededCategories = new Set<string>();
    
    for (const product of productItems) {
      const fallbackCat = (category && category !== '_auto') ? category : ((productType && productType !== '_auto') ? productType : 'outro');
      const cat = product.detectedCategory || fallbackCat;
      if (cat && !existingCategoryKeys.includes(cat) && !hardwareCategories.includes(cat)) {
        neededCategories.add(cat);
      }
    }

    // Create missing product categories
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

    // Pre-create any missing hardware categories
    const existingHardwareCategories = await getHardwareCategories();
    const existingHardwareCategoryKeys = existingHardwareCategories.map(c => c.key);
    const neededHardwareCategories = new Set<string>();
    
    for (const hw of hardwareItems) {
      if (hw.detectedCategory && !existingHardwareCategoryKeys.includes(hw.detectedCategory)) {
        neededHardwareCategories.add(hw.detectedCategory);
      }
    }

    // Create missing hardware categories
    for (const catKey of neededHardwareCategories) {
      try {
        const label = formatCategoryLabel(catKey);
        const icon = getCategoryIcon(catKey);
        await addHardwareCategory({ key: catKey, label, icon });
        createdHardwareCategories.add(catKey);
      } catch (error) {
        console.error('Error creating hardware category:', catKey, error);
      }
    }

    // Import hardware items with AI compatibility detection
    if (hardwareItems.length > 0) {
      // First, get AI-detected compatibility for all hardware items
      let compatibilityMap: Record<number, any> = {};
      
      try {
        console.log('Sending hardware items for compatibility detection:', hardwareItems.map((item, idx) => ({
          index: idx,
          title: item.title,
          category: item.hardwareSubcategory || item.detectedCategory
        })));
        
        const compatResponse = await fetch('https://www.n8nbalao.com/api/generate-hardware-compat.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: hardwareItems.map((item, idx) => ({
              title: item.title,
              category: item.hardwareSubcategory || item.detectedCategory
            }))
          })
        });
        
        const compatData = await compatResponse.json();
        console.log('Compatibility API response:', compatData);
        
        if (compatData.success && Array.isArray(compatData.compatibility)) {
          compatData.compatibility.forEach((compat: any, arrayIdx: number) => {
            if (compat && typeof compat === 'object') {
              // Use index from response if available, otherwise use array position
              const idx = typeof compat.index === 'number' ? compat.index : arrayIdx;
              compatibilityMap[idx] = compat;
              console.log(`Mapped compatibility for index ${idx}:`, compat);
            }
          });
          
          // Show usage info
          if (compatData.usage) {
            toast({
              title: "Compatibilidade detectada por IA",
              description: `Tokens: ${compatData.usage.totalTokens} | Custo: R$ ${compatData.usage.costBRL.toFixed(4)}`
            });
          }
        } else {
          console.error('Invalid compatibility response:', compatData);
        }
      } catch (error) {
        console.error('Error getting AI compatibility:', error);
        toast({
          title: "Aviso",
          description: "Não foi possível detectar compatibilidade via IA. Importando sem dados de compatibilidade.",
          variant: "destructive"
        });
      }
      
      // Now import each hardware item with compatibility data
      for (let i = 0; i < hardwareItems.length; i++) {
        const item = hardwareItems[i];
        setImportProgress({ current: i + 1, total: toImport.length });

        try {
          const finalPrice = calculateFinalPrice(item.costPrice);
          
          // Extract brand and model from title
          const titleParts = item.title.split(' ');
          const brand = titleParts[0] || 'Genérico';
          const model = titleParts.slice(1).join(' ') || item.title;
          
          // Get AI-detected compatibility
          const compat = compatibilityMap[i] || {};

          // Use hardwareSubcategory if available, fallback to detectedCategory
          const hardwareCategory = item.hardwareSubcategory || item.detectedCategory;
          
          await api.createHardware({
            name: item.title,
            brand,
            model,
            price: Math.round(finalPrice * 100) / 100,
            image: item.imageUrl || '',
            specs: {},
            category: hardwareCategory as any,
            // Compatibility fields from AI
            socket: compat.socket || undefined,
            memoryType: compat.memoryType || undefined,
            formFactor: compat.formFactor || undefined,
            tdp: compat.tdp ? Number(compat.tdp) : undefined
          });

          hardwareCount++;
          successCount++;
        } catch (error) {
          console.error('Error importing hardware:', error);
          errorCount++;
        }
      }
    }

    // Import products
    // Check if user manually selected a category (not "_auto")
    const manualCategorySelected = category && category !== '_auto';
    const manualTypeSelected = productType && productType !== '_auto';
    
    for (let i = 0; i < productItems.length; i++) {
      const product = productItems[i];
      setImportProgress({ current: hardwareItems.length + i + 1, total: toImport.length });

      try {
        const finalPrice = calculateFinalPrice(product.costPrice);
        const media = product.imageUrl ? [{ type: 'image' as const, url: product.imageUrl }] : [];
        
        // PRIORITY: Manual selection > Auto-detected > Default 'outro'
        // If user manually selected a category, use it and IGNORE AI detection
        let productCategory: string;
        let productTypeValue: string;
        
        if (manualCategorySelected) {
          // User explicitly selected a category - use it for ALL products
          productCategory = category;
          productTypeValue = manualTypeSelected ? productType : category;
        } else if (manualTypeSelected) {
          // User selected a type but not category - use type for both
          productCategory = productType;
          productTypeValue = productType;
        } else {
          // Auto mode - use detected category or fallback to 'outro'
          productCategory = product.detectedCategory || 'outro';
          productTypeValue = product.detectedCategory || 'outro';
        }

        await api.createProduct({
          title: product.title,
          subtitle: product.simpleDescription || '',
          description: product.fullDescription || product.description || '',
          productType: productTypeValue as any,
          categories: [productCategory],
          media,
          specs: {},
          totalPrice: Math.round(finalPrice * 100) / 100,
          components: {},
          downloadUrl: ''
        });

        productCount++;
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

    const parts: string[] = [];
    if (hardwareCount > 0) parts.push(`${hardwareCount} hardware`);
    if (productCount > 0) parts.push(`${productCount} produtos`);
    if (errorCount > 0) parts.push(`${errorCount} erros`);
    
    const categoryMsg = (createdCategories.size + createdHardwareCategories.size) > 0 
      ? `. ${createdCategories.size + createdHardwareCategories.size} categoria(s) criada(s)` 
      : '';

    toast({
      title: "Importação concluída",
      description: `${parts.join(', ')} importados${categoryMsg}.`
    });
  };

  const totalCost = parsedProducts.filter(p => p.selected).reduce((sum, p) => sum + p.costPrice, 0);
  const totalSale = parsedProducts.filter(p => p.selected).reduce((sum, p) => sum + calculateFinalPrice(p.costPrice), 0);

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    loadCategories();
  };

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AdminFullPageLogin onSuccess={handleLoginSuccess} />;
  }

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
            
            {/* AI Tools */}
            <CardContent className="border-t pt-4">
              <div className="space-y-4">
                {/* AI Title Editing */}
                <div className="p-4 rounded-lg border" style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <Sparkles className="h-4 w-4" style={{ color: '#D97706' }} />
                        <Label className="font-semibold">Editar Títulos com IA</Label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Simplifica e limpa os nomes dos produtos automaticamente (remove códigos, padroniza formato).
                      </p>
                    </div>
                    <Button
                      onClick={editTitlesWithAI}
                      disabled={isEditingTitles || selectedCount === 0}
                      className="text-white hover:opacity-90"
                      style={{ backgroundColor: '#D97706' }}
                    >
                      {isEditingTitles ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {titleEditProgress.current}/{titleEditProgress.total}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Editar com IA ({selectedCount})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* AI Description Generation */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Sparkles className="h-4 w-4" style={{ color: '#DC2626' }} />
                    <Label className="font-semibold">Gerar Descrições com IA</Label>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Store className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Texto da Loja (adicionado às descrições)</span>
                      </div>
                      <Input
                        value={storeText}
                        onChange={(e) => setStoreText(e.target.value)}
                        placeholder="Ex: Balão da Informática - A melhor loja do Brasil"
                        className="border-2 bg-white text-gray-800 placeholder:text-gray-400"
                        style={{ borderColor: '#E5E7EB' }}
                      />
                    </div>
                    <Button
                      onClick={generateDescriptions}
                      disabled={isGeneratingDescriptions || selectedCount === 0}
                      className="self-end text-white hover:opacity-90"
                      style={{ backgroundColor: '#7C3AED' }}
                    >
                      {isGeneratingDescriptions ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {descriptionProgress.current}/{descriptionProgress.total}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Gerar Descrições ({selectedCount})
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    A IA criará descrições simples e completas baseadas no nome de cada produto selecionado.
                  </p>
                  
                  {/* Token Usage Display */}
                  {lastGenerationUsage && (
                    <div className="mt-3 p-3 rounded-lg border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-gray-700">
                            📊 Última operação IA:
                          </span>
                          <span className="text-gray-600">
                            Modelo: <strong>{lastGenerationUsage.model}</strong>
                          </span>
                          <span className="text-gray-600">
                            Tokens: <strong>{lastGenerationUsage.totalTokens.toLocaleString()}</strong>
                            <span className="text-xs ml-1 text-gray-400">
                              (in: {lastGenerationUsage.inputTokens.toLocaleString()} / out: {lastGenerationUsage.outputTokens.toLocaleString()})
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm px-2 py-1 rounded-full font-semibold" style={{ backgroundColor: '#DCFCE7', color: '#166534' }}>
                            💰 R$ {lastGenerationUsage.costBRL.toFixed(4)}
                          </span>
                          <span className="text-xs text-gray-400">
                            (${lastGenerationUsage.costUSD.toFixed(6)} USD)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        {parsedProducts.length > 0 && (
          <Card className="border-2 bg-white" style={{ borderColor: '#E5E7EB' }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#DC2626' }}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
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
                  </div>
                  
                  {/* Bulk Actions */}
                  {selectedCount > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Layers className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">Ações em massa ({selectedCount} selecionados):</span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-xs text-gray-600">Converter para Hardware:</span>
                        {hardwareCategories.map(cat => (
                          <Button
                            key={cat}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={() => {
                              setParsedProducts(prev => prev.map(p => 
                                p.selected 
                                  ? { ...p, isHardware: true, hardwareSubcategory: cat, detectedCategory: cat }
                                  : p
                              ));
                              toast({
                                title: "Produtos convertidos",
                                description: `${selectedCount} itens convertidos para Hardware → ${formatCategoryLabel(cat)}`
                              });
                            }}
                          >
                            {formatCategoryLabel(cat)}
                          </Button>
                        ))}
                      </div>
                      <div className="ml-4 border-l border-blue-300 pl-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-100"
                          onClick={() => {
                            setParsedProducts(prev => prev.map(p => 
                              p.selected 
                                ? { ...p, isHardware: false, hardwareSubcategory: undefined }
                                : p
                            ));
                            toast({
                              title: "Produtos convertidos",
                              description: `${selectedCount} itens convertidos para Produto comum`
                            });
                          }}
                        >
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Produto
                        </Button>
                      </div>
                    </div>
                  )}
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
                      <TableHead>Descrição IA</TableHead>
                      <TableHead>Categoria / Subcategoria</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Custo Ajustado (+{taxa}%)</TableHead>
                      <TableHead className="text-right">Venda (+{margin}%)</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
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
                        <TableCell className="max-w-[200px] truncate text-gray-800" title={product.title}>
                          {product.title}
                        </TableCell>
                        <TableCell className="max-w-[250px]">
                          {product.fullDescription ? (
                            <div className="space-y-1">
                              <p className="text-xs text-green-600 font-medium truncate" title={product.simpleDescription}>
                                ✓ {product.simpleDescription}
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2" title={product.fullDescription}>
                                {product.fullDescription}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Não gerada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {product.isHardware ? (
                              <>
                                <Select
                                  value={product.hardwareSubcategory || product.detectedCategory}
                                  onValueChange={(value) => {
                                    setParsedProducts(prev => prev.map(p => 
                                      p.id === product.id 
                                        ? { ...p, hardwareSubcategory: value, detectedCategory: value }
                                        : p
                                    ));
                                  }}
                                >
                                  <SelectTrigger className="h-7 text-xs bg-blue-50 border-blue-200">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    {hardwareCategories.map(cat => (
                                      <SelectItem key={cat} value={cat} className="text-sm">
                                        {formatCategoryLabel(cat)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <span className="text-xs text-blue-600 font-medium">
                                  → Hardware
                                </span>
                              </>
                            ) : product.detectedCategory ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {formatCategoryLabel(product.detectedCategory)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                {category && category !== '_auto' ? formatCategoryLabel(category) : 'Outro'}
                              </span>
                            )}
                          </div>
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
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${product.isHardware ? 'text-blue-500 hover:text-blue-700' : 'text-green-500 hover:text-green-700'}`}
                              onClick={() => {
                                setParsedProducts(prev => prev.map(p => {
                                  if (p.id === product.id) {
                                    const newIsHardware = !p.isHardware;
                                    return { 
                                      ...p, 
                                      isHardware: newIsHardware,
                                      hardwareSubcategory: newIsHardware ? 'processor' : undefined
                                    };
                                  }
                                  return p;
                                }));
                              }}
                              title={product.isHardware ? 'Converter para Produto' : 'Converter para Hardware'}
                            >
                              {product.isHardware ? <ShoppingBag className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => removeProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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