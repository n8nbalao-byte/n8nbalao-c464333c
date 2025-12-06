import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { api, type Product, type HardwareItem, type MediaItem, type ProductComponents } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Upload, Play, Image, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box, Package, Download, Droplets } from "lucide-react";
import * as XLSX from "xlsx";
import { HardwareCard } from "@/components/HardwareCard";

// Simple auth - for demo purposes only
const ADMIN_USER = "n8nbalao";
const ADMIN_PASS = "Balao2025";

type AdminTab = 'products' | 'hardware';
type HardwareCategory = 'processor' | 'motherboard' | 'memory' | 'storage' | 'gpu' | 'psu' | 'case' | 'watercooler';

interface ProductFormData {
  title: string;
  subtitle: string;
  categories: string[];
  media: MediaItem[];
  specs: Record<string, string>;
  components: ProductComponents;
  totalPrice: number;
}

interface HardwareFormData {
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  specs: Record<string, string>;
  category: HardwareCategory;
}

const defaultProductFormData: ProductFormData = {
  title: "",
  subtitle: "",
  categories: [],
  media: [],
  specs: {},
  components: {},
  totalPrice: 0,
};

const defaultHardwareFormData: HardwareFormData = {
  name: "",
  brand: "",
  model: "",
  price: 0,
  image: "",
  specs: {},
  category: "processor",
};

const componentSteps = [
  { key: 'processor', label: 'Processador', icon: Cpu },
  { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
  { key: 'watercooler', label: 'Watercooler', icon: Droplets },
  { key: 'psu', label: 'Fonte', icon: Zap },
  { key: 'case', label: 'Gabinete', icon: Box },
] as const;

const hardwareCategories: { key: HardwareCategory; label: string; icon: React.ElementType }[] = [
  { key: 'processor', label: 'Processadores', icon: Cpu },
  { key: 'motherboard', label: 'Placas-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placas de Vídeo', icon: Monitor },
  { key: 'psu', label: 'Fontes', icon: Zap },
  { key: 'case', label: 'Gabinetes', icon: Box },
  { key: 'watercooler', label: 'Watercooler', icon: Droplets },
];

export default function Admin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [hardware, setHardware] = useState<Record<string, HardwareItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState<ProductFormData>(defaultProductFormData);
  const [newCategory, setNewCategory] = useState("");
  const [newProductSpecKey, setNewProductSpecKey] = useState("");
  const [newProductSpecValue, setNewProductSpecValue] = useState("");

  // Hardware state
  const [activeHardwareCategory, setActiveHardwareCategory] = useState<HardwareCategory>('processor');
  const [hardwareList, setHardwareList] = useState<HardwareItem[]>([]);
  const [isEditingHardware, setIsEditingHardware] = useState(false);
  const [editingHardwareId, setEditingHardwareId] = useState<string | null>(null);
  const [hardwareFormData, setHardwareFormData] = useState<HardwareFormData>(defaultHardwareFormData);
  const [newHardwareSpecKey, setNewHardwareSpecKey] = useState("");
  const [newHardwareSpecValue, setNewHardwareSpecValue] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    if (saved === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'products') {
        fetchProductsData();
      } else {
        fetchHardwareData();
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, activeTab, activeHardwareCategory]);

  async function fetchProductsData() {
    setLoading(true);
    const [productsData, ...hardwareData] = await Promise.all([
      api.getProducts(),
      ...componentSteps.map(step => api.getHardware(step.key)),
    ]);
    
    setProducts(productsData);
    
    const hardwareByCategory: Record<string, HardwareItem[]> = {};
    componentSteps.forEach((step, i) => {
      hardwareByCategory[step.key] = hardwareData[i];
    });
    setHardware(hardwareByCategory);
    setLoading(false);
  }

  async function fetchHardwareData() {
    setLoading(true);
    const data = await api.getHardware(activeHardwareCategory);
    setHardwareList(data);
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

  // Product functions
  function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
        setProductFormData(prev => ({
          ...prev,
          media: [...prev.media, { type, url: reader.result as string }],
        }));
      };
      reader.readAsDataURL(file);
    });
  }

  function removeMedia(index: number) {
    setProductFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  }

  function addCategory() {
    if (newCategory.trim()) {
      setProductFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()],
      }));
      setNewCategory("");
    }
  }

  function removeCategory(index: number) {
    setProductFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index),
    }));
  }

  function addProductSpec() {
    if (newProductSpecKey.trim() && newProductSpecValue.trim()) {
      setProductFormData(prev => ({
        ...prev,
        specs: { ...prev.specs, [newProductSpecKey.trim()]: newProductSpecValue.trim() },
      }));
      setNewProductSpecKey("");
      setNewProductSpecValue("");
    }
  }

  function removeProductSpec(key: string) {
    setProductFormData(prev => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[key];
      return { ...prev, specs: newSpecs };
    });
  }

  function selectComponent(category: string, item: HardwareItem | undefined) {
    setProductFormData(prev => {
      const newComponents = { ...prev.components, [category]: item };
      const totalPrice = Object.values(newComponents).reduce((sum, hw) => sum + (hw?.price || 0), 0);
      return { ...prev, components: newComponents, totalPrice };
    });
  }

  function openProductEditor(product?: Product) {
    if (product) {
      setEditingProductId(product.id);
      setProductFormData({
        title: product.title,
        subtitle: product.subtitle || "",
        categories: product.categories || [],
        media: product.media || [],
        specs: product.specs || {},
        components: product.components || {},
        totalPrice: product.totalPrice,
      });
    } else {
      setEditingProductId(null);
      setProductFormData(defaultProductFormData);
    }
    setIsEditingProduct(true);
  }

  function closeProductEditor() {
    setIsEditingProduct(false);
    setEditingProductId(null);
    setProductFormData(defaultProductFormData);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productFormData.title) {
      toast({ title: "Erro", description: "O título é obrigatório", variant: "destructive" });
      return;
    }

    const missingComponents = componentSteps.filter(
      step => !productFormData.components[step.key as keyof ProductComponents]
    );

    if (missingComponents.length > 0) {
      toast({
        title: "Componentes obrigatórios",
        description: `Selecione: ${missingComponents.map(c => c.label).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    let success: boolean;

    if (editingProductId) {
      success = await api.updateProduct(editingProductId, productFormData);
    } else {
      success = await api.createProduct(productFormData);
    }

    if (success) {
      toast({ title: "Sucesso", description: editingProductId ? "Produto atualizado!" : "Produto criado!" });
      closeProductEditor();
      fetchProductsData();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar produto", variant: "destructive" });
    }
  }

  async function handleProductDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      const success = await api.deleteProduct(id);
      if (success) {
        toast({ title: "Sucesso", description: "Produto excluído!" });
        fetchProductsData();
      } else {
        toast({ title: "Erro", description: "Falha ao excluir produto", variant: "destructive" });
      }
    }
  }

  // Hardware functions

  function addHardwareSpec() {
    if (newHardwareSpecKey.trim() && newHardwareSpecValue.trim()) {
      setHardwareFormData(prev => ({
        ...prev,
        specs: { ...prev.specs, [newHardwareSpecKey.trim()]: newHardwareSpecValue.trim() },
      }));
      setNewHardwareSpecKey("");
      setNewHardwareSpecValue("");
    }
  }

  function removeHardwareSpec(key: string) {
    setHardwareFormData(prev => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[key];
      return { ...prev, specs: newSpecs };
    });
  }

  function openHardwareEditor(item?: HardwareItem) {
    if (item) {
      setEditingHardwareId(item.id);
      setHardwareFormData({
        name: item.name,
        brand: item.brand,
        model: item.model,
        price: item.price,
        image: item.image || "",
        specs: item.specs || {},
        category: item.category,
      });
    } else {
      setEditingHardwareId(null);
      setHardwareFormData({ ...defaultHardwareFormData, category: activeHardwareCategory });
    }
    setIsEditingHardware(true);
  }

  function closeHardwareEditor() {
    setIsEditingHardware(false);
    setEditingHardwareId(null);
    setHardwareFormData(defaultHardwareFormData);
  }

  async function handleHardwareSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!hardwareFormData.name || !hardwareFormData.brand || !hardwareFormData.model) {
      toast({ title: "Erro", description: "Preencha nome, marca e modelo", variant: "destructive" });
      return;
    }

    let success: boolean;

    if (editingHardwareId) {
      success = await api.updateHardware(editingHardwareId, hardwareFormData);
    } else {
      success = await api.createHardware(hardwareFormData);
    }

    if (success) {
      toast({ title: "Sucesso", description: editingHardwareId ? "Hardware atualizado!" : "Hardware criado!" });
      closeHardwareEditor();
      fetchHardwareData();
    } else {
      toast({ title: "Erro", description: "Falha ao salvar hardware", variant: "destructive" });
    }
  }

  async function handleHardwareDelete(id: string) {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      const success = await api.deleteHardware(id);
      if (success) {
        toast({ title: "Sucesso", description: "Hardware excluído!" });
        fetchHardwareData();
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

  // Bulk upload functions
  function downloadExcelTemplate() {
    const templateData = [
      {
        nome: "Exemplo Processador",
        marca: "Intel",
        modelo: "Core i7-13700K",
        preco: 2499.99,
        categoria: activeHardwareCategory,
        spec_1_chave: "Núcleos",
        spec_1_valor: "16",
        spec_2_chave: "Threads",
        spec_2_valor: "24",
        spec_3_chave: "Frequência",
        spec_3_valor: "3.4GHz",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hardware");

    // Auto-size columns
    ws["!cols"] = [
      { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    ];

    XLSX.writeFile(wb, `template_hardware_${activeHardwareCategory}.xlsx`);
    toast({ title: "Download iniciado", description: "Use este modelo para envio em massa" });
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        const specs: Record<string, string> = {};
        
        // Extract specs from columns
        for (let i = 1; i <= 10; i++) {
          const key = row[`spec_${i}_chave`];
          const value = row[`spec_${i}_valor`];
          if (key && value) {
            specs[key] = String(value);
          }
        }

        const hardwareItem = {
          name: row.nome || "",
          brand: row.marca || "",
          model: row.modelo || "",
          price: parseFloat(row.preco) || 0,
          image: "",
          specs,
          category: (row.categoria || activeHardwareCategory) as HardwareCategory,
        };

        if (hardwareItem.name && hardwareItem.brand && hardwareItem.model) {
          const success = await api.createHardware(hardwareItem);
          if (success) successCount++;
          else errorCount++;
        } else {
          errorCount++;
        }
      }

      toast({
        title: "Upload concluído",
        description: `${successCount} itens criados, ${errorCount} erros`,
      });
      fetchHardwareData();
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  // Populate test data function
  async function populateTestData() {
    const testData: Record<HardwareCategory, Array<{ name: string; brand: string; model: string; price: number; specs: Record<string, string> }>> = {
      processor: [
        { name: "Processador Intel Core i9-14900K", brand: "Intel", model: "Core i9-14900K", price: 3899.00, specs: { "Núcleos": "24", "Threads": "32", "Frequência Base": "3.2GHz", "Frequência Turbo": "6.0GHz" } },
        { name: "Processador Intel Core i7-14700K", brand: "Intel", model: "Core i7-14700K", price: 2799.00, specs: { "Núcleos": "20", "Threads": "28", "Frequência Base": "3.4GHz", "Frequência Turbo": "5.6GHz" } },
        { name: "Processador Intel Core i5-14600K", brand: "Intel", model: "Core i5-14600K", price: 1899.00, specs: { "Núcleos": "14", "Threads": "20", "Frequência Base": "3.5GHz", "Frequência Turbo": "5.3GHz" } },
        { name: "Processador AMD Ryzen 9 7950X", brand: "AMD", model: "Ryzen 9 7950X", price: 3599.00, specs: { "Núcleos": "16", "Threads": "32", "Frequência Base": "4.5GHz", "Frequência Turbo": "5.7GHz" } },
        { name: "Processador AMD Ryzen 7 7800X3D", brand: "AMD", model: "Ryzen 7 7800X3D", price: 2499.00, specs: { "Núcleos": "8", "Threads": "16", "Frequência Base": "4.2GHz", "3D V-Cache": "96MB" } },
        { name: "Processador AMD Ryzen 5 7600X", brand: "AMD", model: "Ryzen 5 7600X", price: 1499.00, specs: { "Núcleos": "6", "Threads": "12", "Frequência Base": "4.7GHz", "Frequência Turbo": "5.3GHz" } },
        { name: "Processador Intel Core i9-13900K", brand: "Intel", model: "Core i9-13900K", price: 3299.00, specs: { "Núcleos": "24", "Threads": "32", "Frequência Base": "3.0GHz", "Frequência Turbo": "5.8GHz" } },
        { name: "Processador AMD Ryzen 9 7900X", brand: "AMD", model: "Ryzen 9 7900X", price: 2899.00, specs: { "Núcleos": "12", "Threads": "24", "Frequência Base": "4.7GHz", "Frequência Turbo": "5.6GHz" } },
        { name: "Processador Intel Core i3-14100", brand: "Intel", model: "Core i3-14100", price: 899.00, specs: { "Núcleos": "4", "Threads": "8", "Frequência Base": "3.5GHz", "Frequência Turbo": "4.7GHz" } },
        { name: "Processador AMD Ryzen 5 5600X", brand: "AMD", model: "Ryzen 5 5600X", price: 999.00, specs: { "Núcleos": "6", "Threads": "12", "Frequência Base": "3.7GHz", "Frequência Turbo": "4.6GHz" } },
      ],
      motherboard: [
        { name: "Placa-Mãe ASUS ROG Maximus Z790 Hero", brand: "ASUS", model: "ROG Maximus Z790 Hero", price: 4299.00, specs: { "Socket": "LGA 1700", "Chipset": "Z790", "DDR5": "Sim", "PCIe 5.0": "Sim" } },
        { name: "Placa-Mãe MSI MEG Z790 ACE", brand: "MSI", model: "MEG Z790 ACE", price: 3899.00, specs: { "Socket": "LGA 1700", "Chipset": "Z790", "DDR5": "Sim", "USB 4": "Sim" } },
        { name: "Placa-Mãe Gigabyte Z790 AORUS Master", brand: "Gigabyte", model: "Z790 AORUS Master", price: 3599.00, specs: { "Socket": "LGA 1700", "Chipset": "Z790", "DDR5": "Sim", "WiFi 6E": "Sim" } },
        { name: "Placa-Mãe ASUS ROG Crosshair X670E Hero", brand: "ASUS", model: "ROG Crosshair X670E Hero", price: 4499.00, specs: { "Socket": "AM5", "Chipset": "X670E", "DDR5": "Sim", "PCIe 5.0": "Sim" } },
        { name: "Placa-Mãe MSI MAG B650 TOMAHAWK", brand: "MSI", model: "MAG B650 TOMAHAWK", price: 1599.00, specs: { "Socket": "AM5", "Chipset": "B650", "DDR5": "Sim", "USB-C": "Sim" } },
        { name: "Placa-Mãe Gigabyte B650 AORUS Elite AX", brand: "Gigabyte", model: "B650 AORUS Elite AX", price: 1399.00, specs: { "Socket": "AM5", "Chipset": "B650", "DDR5": "Sim", "WiFi 6E": "Sim" } },
        { name: "Placa-Mãe ASUS TUF Gaming B760M-Plus", brand: "ASUS", model: "TUF Gaming B760M-Plus", price: 1199.00, specs: { "Socket": "LGA 1700", "Chipset": "B760", "DDR5": "Sim", "mATX": "Sim" } },
        { name: "Placa-Mãe ASRock B650M Pro RS", brand: "ASRock", model: "B650M Pro RS", price: 999.00, specs: { "Socket": "AM5", "Chipset": "B650", "DDR5": "Sim", "mATX": "Sim" } },
        { name: "Placa-Mãe MSI PRO B760-P", brand: "MSI", model: "PRO B760-P", price: 899.00, specs: { "Socket": "LGA 1700", "Chipset": "B760", "DDR4": "Sim", "ATX": "Sim" } },
        { name: "Placa-Mãe Gigabyte A620M Gaming X", brand: "Gigabyte", model: "A620M Gaming X", price: 699.00, specs: { "Socket": "AM5", "Chipset": "A620", "DDR5": "Sim", "mATX": "Sim" } },
      ],
      memory: [
        { name: "Memória G.Skill Trident Z5 RGB 64GB", brand: "G.Skill", model: "Trident Z5 RGB 64GB", price: 1899.00, specs: { "Capacidade": "64GB (2x32GB)", "Velocidade": "DDR5-6000", "Latência": "CL30", "RGB": "Sim" } },
        { name: "Memória Corsair Dominator Platinum 32GB", brand: "Corsair", model: "Dominator Platinum 32GB", price: 1299.00, specs: { "Capacidade": "32GB (2x16GB)", "Velocidade": "DDR5-6400", "Latência": "CL32", "RGB": "Sim" } },
        { name: "Memória Kingston Fury Beast 32GB", brand: "Kingston", model: "Fury Beast 32GB", price: 899.00, specs: { "Capacidade": "32GB (2x16GB)", "Velocidade": "DDR5-5600", "Latência": "CL36", "Heatspreader": "Sim" } },
        { name: "Memória G.Skill Trident Z5 32GB", brand: "G.Skill", model: "Trident Z5 32GB", price: 999.00, specs: { "Capacidade": "32GB (2x16GB)", "Velocidade": "DDR5-6000", "Latência": "CL30", "RGB": "Não" } },
        { name: "Memória Corsair Vengeance 32GB", brand: "Corsair", model: "Vengeance 32GB", price: 749.00, specs: { "Capacidade": "32GB (2x16GB)", "Velocidade": "DDR5-5200", "Latência": "CL40", "Low Profile": "Sim" } },
        { name: "Memória Crucial Ballistix 16GB", brand: "Crucial", model: "Ballistix 16GB", price: 449.00, specs: { "Capacidade": "16GB (2x8GB)", "Velocidade": "DDR4-3600", "Latência": "CL16", "RGB": "Não" } },
        { name: "Memória HyperX Fury 16GB", brand: "HyperX", model: "Fury 16GB", price: 399.00, specs: { "Capacidade": "16GB (2x8GB)", "Velocidade": "DDR4-3200", "Latência": "CL16", "Heatspreader": "Sim" } },
        { name: "Memória TeamGroup T-Force Delta 32GB", brand: "TeamGroup", model: "T-Force Delta 32GB", price: 799.00, specs: { "Capacidade": "32GB (2x16GB)", "Velocidade": "DDR5-5600", "Latência": "CL36", "RGB": "Sim" } },
        { name: "Memória Patriot Viper Steel 32GB", brand: "Patriot", model: "Viper Steel 32GB", price: 649.00, specs: { "Capacidade": "32GB (2x16GB)", "Velocidade": "DDR4-3600", "Latência": "CL18", "Alumínio": "Sim" } },
        { name: "Memória ADATA XPG Lancer 32GB", brand: "ADATA", model: "XPG Lancer 32GB", price: 849.00, specs: { "Capacidade": "32GB (2x16GB)", "Velocidade": "DDR5-5600", "Latência": "CL36", "RGB": "Sim" } },
      ],
      storage: [
        { name: "SSD Samsung 990 Pro 2TB", brand: "Samsung", model: "990 Pro 2TB", price: 1499.00, specs: { "Capacidade": "2TB", "Interface": "NVMe PCIe 4.0", "Leitura": "7450 MB/s", "Escrita": "6900 MB/s" } },
        { name: "SSD WD Black SN850X 2TB", brand: "Western Digital", model: "SN850X 2TB", price: 1399.00, specs: { "Capacidade": "2TB", "Interface": "NVMe PCIe 4.0", "Leitura": "7300 MB/s", "Escrita": "6600 MB/s" } },
        { name: "SSD Crucial T700 2TB", brand: "Crucial", model: "T700 2TB", price: 1899.00, specs: { "Capacidade": "2TB", "Interface": "NVMe PCIe 5.0", "Leitura": "12400 MB/s", "Escrita": "11800 MB/s" } },
        { name: "SSD Samsung 980 Pro 1TB", brand: "Samsung", model: "980 Pro 1TB", price: 799.00, specs: { "Capacidade": "1TB", "Interface": "NVMe PCIe 4.0", "Leitura": "7000 MB/s", "Escrita": "5100 MB/s" } },
        { name: "SSD Kingston KC3000 2TB", brand: "Kingston", model: "KC3000 2TB", price: 1299.00, specs: { "Capacidade": "2TB", "Interface": "NVMe PCIe 4.0", "Leitura": "7000 MB/s", "Escrita": "7000 MB/s" } },
        { name: "SSD Seagate FireCuda 530 1TB", brand: "Seagate", model: "FireCuda 530 1TB", price: 899.00, specs: { "Capacidade": "1TB", "Interface": "NVMe PCIe 4.0", "Leitura": "7300 MB/s", "Escrita": "6000 MB/s" } },
        { name: "SSD Corsair MP600 Pro XT 2TB", brand: "Corsair", model: "MP600 Pro XT 2TB", price: 1599.00, specs: { "Capacidade": "2TB", "Interface": "NVMe PCIe 4.0", "Leitura": "7100 MB/s", "Heatsink": "Sim" } },
        { name: "SSD Sabrent Rocket 4 Plus 2TB", brand: "Sabrent", model: "Rocket 4 Plus 2TB", price: 1199.00, specs: { "Capacidade": "2TB", "Interface": "NVMe PCIe 4.0", "Leitura": "7100 MB/s", "Escrita": "6600 MB/s" } },
        { name: "SSD ADATA Legend 960 1TB", brand: "ADATA", model: "Legend 960 1TB", price: 699.00, specs: { "Capacidade": "1TB", "Interface": "NVMe PCIe 4.0", "Leitura": "7400 MB/s", "Escrita": "6800 MB/s" } },
        { name: "SSD Gigabyte AORUS Gen5 2TB", brand: "Gigabyte", model: "AORUS Gen5 2TB", price: 2199.00, specs: { "Capacidade": "2TB", "Interface": "NVMe PCIe 5.0", "Leitura": "12400 MB/s", "Heatsink": "Sim" } },
      ],
      gpu: [
        { name: "Placa de Vídeo NVIDIA RTX 4090", brand: "NVIDIA", model: "GeForce RTX 4090", price: 12999.00, specs: { "VRAM": "24GB GDDR6X", "CUDA Cores": "16384", "Boost Clock": "2.52 GHz", "TDP": "450W" } },
        { name: "Placa de Vídeo NVIDIA RTX 4080 Super", brand: "NVIDIA", model: "GeForce RTX 4080 Super", price: 8999.00, specs: { "VRAM": "16GB GDDR6X", "CUDA Cores": "10240", "Boost Clock": "2.55 GHz", "TDP": "320W" } },
        { name: "Placa de Vídeo NVIDIA RTX 4070 Ti Super", brand: "NVIDIA", model: "GeForce RTX 4070 Ti Super", price: 6499.00, specs: { "VRAM": "16GB GDDR6X", "CUDA Cores": "8448", "Boost Clock": "2.61 GHz", "TDP": "285W" } },
        { name: "Placa de Vídeo AMD RX 7900 XTX", brand: "AMD", model: "Radeon RX 7900 XTX", price: 7999.00, specs: { "VRAM": "24GB GDDR6", "Stream Processors": "6144", "Boost Clock": "2.5 GHz", "TDP": "355W" } },
        { name: "Placa de Vídeo NVIDIA RTX 4070 Super", brand: "NVIDIA", model: "GeForce RTX 4070 Super", price: 4999.00, specs: { "VRAM": "12GB GDDR6X", "CUDA Cores": "7168", "Boost Clock": "2.48 GHz", "TDP": "220W" } },
        { name: "Placa de Vídeo AMD RX 7800 XT", brand: "AMD", model: "Radeon RX 7800 XT", price: 3999.00, specs: { "VRAM": "16GB GDDR6", "Stream Processors": "3840", "Boost Clock": "2.43 GHz", "TDP": "263W" } },
        { name: "Placa de Vídeo NVIDIA RTX 4060 Ti", brand: "NVIDIA", model: "GeForce RTX 4060 Ti", price: 3299.00, specs: { "VRAM": "8GB GDDR6", "CUDA Cores": "4352", "Boost Clock": "2.54 GHz", "TDP": "160W" } },
        { name: "Placa de Vídeo AMD RX 7700 XT", brand: "AMD", model: "Radeon RX 7700 XT", price: 2999.00, specs: { "VRAM": "12GB GDDR6", "Stream Processors": "3456", "Boost Clock": "2.54 GHz", "TDP": "245W" } },
        { name: "Placa de Vídeo NVIDIA RTX 4060", brand: "NVIDIA", model: "GeForce RTX 4060", price: 2499.00, specs: { "VRAM": "8GB GDDR6", "CUDA Cores": "3072", "Boost Clock": "2.46 GHz", "TDP": "115W" } },
        { name: "Placa de Vídeo AMD RX 7600", brand: "AMD", model: "Radeon RX 7600", price: 1999.00, specs: { "VRAM": "8GB GDDR6", "Stream Processors": "2048", "Boost Clock": "2.66 GHz", "TDP": "165W" } },
      ],
      watercooler: [
        { name: "Watercooler NZXT Kraken Z73 RGB", brand: "NZXT", model: "Kraken Z73 RGB", price: 1899.00, specs: { "Radiador": "360mm", "Display LCD": "2.36\" LCD", "RGB": "Sim", "Compatibilidade": "Intel/AMD" } },
        { name: "Watercooler Corsair iCUE H170i Elite", brand: "Corsair", model: "iCUE H170i Elite", price: 1699.00, specs: { "Radiador": "420mm", "Fans": "3x 140mm", "RGB": "Sim", "Software": "iCUE" } },
        { name: "Watercooler ASUS ROG Ryujin III 360", brand: "ASUS", model: "ROG Ryujin III 360", price: 2199.00, specs: { "Radiador": "360mm", "Display OLED": "3.5\"", "RGB": "Sim", "VRM Fan": "Sim" } },
        { name: "Watercooler Lian Li Galahad II 360", brand: "Lian Li", model: "Galahad II 360", price: 1299.00, specs: { "Radiador": "360mm", "Fans": "3x 120mm", "RGB": "Sim", "Infinity Mirror": "Sim" } },
        { name: "Watercooler DeepCool LT720 WH", brand: "DeepCool", model: "LT720 WH", price: 999.00, specs: { "Radiador": "360mm", "Fans": "3x 120mm", "RGB": "ARGB", "Cor": "Branco" } },
        { name: "Watercooler Cooler Master MasterLiquid 360", brand: "Cooler Master", model: "MasterLiquid 360 Atmos", price: 899.00, specs: { "Radiador": "360mm", "Fans": "3x 120mm", "RGB": "ARGB", "Dual Chamber": "Sim" } },
        { name: "Watercooler Arctic Liquid Freezer II 280", brand: "Arctic", model: "Liquid Freezer II 280", price: 799.00, specs: { "Radiador": "280mm", "Fans": "2x 140mm", "VRM Fan": "Integrado", "Silencioso": "Sim" } },
        { name: "Watercooler EK-AIO Elite 360 D-RGB", brand: "EK", model: "AIO Elite 360 D-RGB", price: 1399.00, specs: { "Radiador": "360mm", "Fans": "3x 120mm", "RGB": "D-RGB", "Vardar Fans": "Sim" } },
        { name: "Watercooler be quiet! Silent Loop 2 360", brand: "be quiet!", model: "Silent Loop 2 360", price: 1199.00, specs: { "Radiador": "360mm", "Fans": "3x 120mm", "RGB": "ARGB", "Silencioso": "36dB" } },
        { name: "Watercooler Thermaltake TH360 ARGB", brand: "Thermaltake", model: "TH360 ARGB Sync", price: 699.00, specs: { "Radiador": "360mm", "Fans": "3x 120mm", "RGB": "ARGB", "Sync": "Motherboard" } },
      ],
      psu: [
        { name: "Fonte Corsair RM1000x 1000W", brand: "Corsair", model: "RM1000x", price: 1299.00, specs: { "Potência": "1000W", "Certificação": "80 Plus Gold", "Modular": "Full", "ATX 3.0": "Sim" } },
        { name: "Fonte Seasonic PRIME TX-1000 1000W", brand: "Seasonic", model: "PRIME TX-1000", price: 1899.00, specs: { "Potência": "1000W", "Certificação": "80 Plus Titanium", "Modular": "Full", "Garantia": "12 anos" } },
        { name: "Fonte EVGA SuperNOVA 1000 G7", brand: "EVGA", model: "SuperNOVA 1000 G7", price: 1199.00, specs: { "Potência": "1000W", "Certificação": "80 Plus Gold", "Modular": "Full", "Eco Mode": "Sim" } },
        { name: "Fonte Corsair HX1200 1200W", brand: "Corsair", model: "HX1200", price: 1599.00, specs: { "Potência": "1200W", "Certificação": "80 Plus Platinum", "Modular": "Full", "Zero RPM": "Sim" } },
        { name: "Fonte be quiet! Dark Power 13 850W", brand: "be quiet!", model: "Dark Power 13 850W", price: 1399.00, specs: { "Potência": "850W", "Certificação": "80 Plus Titanium", "Modular": "Full", "ATX 3.0": "Sim" } },
        { name: "Fonte Cooler Master V850 SFX Gold", brand: "Cooler Master", model: "V850 SFX Gold", price: 999.00, specs: { "Potência": "850W", "Certificação": "80 Plus Gold", "Form Factor": "SFX", "Modular": "Full" } },
        { name: "Fonte MSI MEG Ai1000P PCIE5", brand: "MSI", model: "MEG Ai1000P PCIE5", price: 1799.00, specs: { "Potência": "1000W", "Certificação": "80 Plus Platinum", "ATX 3.0": "Sim", "PCIe 5.0": "Sim" } },
        { name: "Fonte ASUS ROG Thor 1000P2", brand: "ASUS", model: "ROG Thor 1000P2", price: 1999.00, specs: { "Potência": "1000W", "Certificação": "80 Plus Platinum", "OLED Display": "Sim", "RGB": "Aura Sync" } },
        { name: "Fonte Thermaltake Toughpower GF3 850W", brand: "Thermaltake", model: "Toughpower GF3 850W", price: 899.00, specs: { "Potência": "850W", "Certificação": "80 Plus Gold", "ATX 3.0": "Sim", "PCIe 5.0": "Sim" } },
        { name: "Fonte XPG Core Reactor II 850W", brand: "XPG", model: "Core Reactor II 850W", price: 799.00, specs: { "Potência": "850W", "Certificação": "80 Plus Gold", "Modular": "Full", "Compacta": "Sim" } },
      ],
      case: [
        { name: "Gabinete Lian Li O11 Dynamic EVO", brand: "Lian Li", model: "O11 Dynamic EVO", price: 1299.00, specs: { "Form Factor": "Mid-Tower", "Vidro": "Temperado", "Slots GPU": "420mm", "Radiador": "360mm x2" } },
        { name: "Gabinete NZXT H9 Elite", brand: "NZXT", model: "H9 Elite", price: 1599.00, specs: { "Form Factor": "Mid-Tower", "Vidro": "Dual Tempered", "Fans": "4x 120mm RGB", "USB-C": "Sim" } },
        { name: "Gabinete Corsair 5000D Airflow", brand: "Corsair", model: "5000D Airflow", price: 999.00, specs: { "Form Factor": "Mid-Tower", "Airflow": "Alto", "Fans": "2x 120mm", "Slots SSD": "4" } },
        { name: "Gabinete Phanteks Evolv X2", brand: "Phanteks", model: "Evolv X2", price: 1899.00, specs: { "Form Factor": "Mid-Tower", "Vidro": "Temperado", "RGB": "D-RGB", "E-ATX": "Sim" } },
        { name: "Gabinete Fractal Design Torrent", brand: "Fractal Design", model: "Torrent", price: 1199.00, specs: { "Form Factor": "Mid-Tower", "Airflow": "Máximo", "Fans": "5x 180mm", "Open Front": "Sim" } },
        { name: "Gabinete be quiet! Dark Base Pro 901", brand: "be quiet!", model: "Dark Base Pro 901", price: 1799.00, specs: { "Form Factor": "Full Tower", "Silencioso": "Sim", "Inversível": "Sim", "Wireless Charging": "Sim" } },
        { name: "Gabinete ASUS ROG Hyperion GR701", brand: "ASUS", model: "ROG Hyperion GR701", price: 2499.00, specs: { "Form Factor": "Full Tower", "E-ATX": "Sim", "GPU Holder": "Integrado", "RGB": "Aura Sync" } },
        { name: "Gabinete Cooler Master HAF 700 EVO", brand: "Cooler Master", model: "HAF 700 EVO", price: 2199.00, specs: { "Form Factor": "Full Tower", "Display LCD": "Sim", "Fans": "200mm x2", "Edge Lit": "Sim" } },
        { name: "Gabinete Thermaltake View 51 TG ARGB", brand: "Thermaltake", model: "View 51 TG ARGB", price: 1099.00, specs: { "Form Factor": "Full Tower", "Vidro": "3x Temperado", "Vertical GPU": "Sim", "RGB": "ARGB" } },
        { name: "Gabinete MSI MEG Prospect 700R", brand: "MSI", model: "MEG Prospect 700R", price: 1699.00, specs: { "Form Factor": "Full Tower", "Vidro": "Touch Display", "E-ATX": "Sim", "RGB": "Mystic Light" } },
      ],
    };

    let totalSuccess = 0;
    let totalError = 0;

    for (const [category, items] of Object.entries(testData)) {
      for (const item of items) {
        const success = await api.createHardware({
          ...item,
          image: "",
          category: category as HardwareCategory,
        });
        if (success) totalSuccess++;
        else totalError++;
      }
    }

    toast({
      title: "Dados de teste criados!",
      description: `${totalSuccess} itens adicionados, ${totalError} erros`,
    });
    
    fetchHardwareData();
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground">Painel Admin</h1>
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

  const ActiveHardwareIcon = hardwareCategories.find(c => c.key === activeHardwareCategory)?.icon || Cpu;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />

      <main className="py-12">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Painel de Controle</h1>
              <p className="mt-2 text-muted-foreground">Gerencie produtos e componentes</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => activeTab === 'products' ? openProductEditor() : openHardwareEditor()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                {activeTab === 'products' ? 'Novo PC' : 'Novo Item'}
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-border px-4 py-3 text-foreground transition-colors hover:bg-secondary"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
                activeTab === 'products'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <Package className="h-5 w-5" />
              PCs Montados
            </button>
            <button
              onClick={() => setActiveTab('hardware')}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
                activeTab === 'hardware'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <Cpu className="h-5 w-5" />
              Hardware
            </button>
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <>
              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Mídia</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Título</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Componentes</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Preço</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((product) => (
                        <tr key={product.id} className="hover:bg-secondary/50">
                          <td className="px-6 py-4">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                              {product.media?.[0]?.type === 'video' ? (
                                <Play className="h-6 w-6 text-muted-foreground" />
                              ) : (
                                <img
                                  src={product.media?.[0]?.url || "/placeholder.svg"}
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground">{product.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {Object.keys(product.components || {}).length} componentes
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-primary">{formatPrice(product.totalPrice)}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openProductEditor(product)}
                                className="rounded-lg bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleProductDelete(product.id)}
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
            </>
          )}

          {/* Hardware Tab */}
          {activeTab === 'hardware' && (
            <>
              {/* Bulk Upload Button */}
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={downloadExcelTemplate}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  <Download className="h-4 w-4" />
                  Envio em Massa
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                  <Upload className="h-4 w-4" />
                  Importar Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={populateTestData}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Popular Dados de Teste
                </button>
              </div>

              {/* Hardware Category Tabs */}
              <div className="mb-6 flex flex-wrap gap-2">
                {hardwareCategories.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveHardwareCategory(cat.key)}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        activeHardwareCategory === cat.key
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
                      {hardwareList.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/50">
                          <td className="px-6 py-4">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <ActiveHardwareIcon className="h-6 w-6 text-muted-foreground" />
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
                                onClick={() => openHardwareEditor(item)}
                                className="rounded-lg bg-secondary p-2 text-foreground transition-colors hover:bg-secondary/80"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleHardwareDelete(item.id)}
                                className="rounded-lg bg-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {hardwareList.length === 0 && (
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
            </>
          )}
        </div>
      </main>

      {/* Product Editor Modal */}
      {isEditingProduct && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
          <div className="my-8 w-full max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {editingProductId ? "Editar PC" : "Montar Novo PC"}
              </h2>
              <button onClick={closeProductEditor} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-8">
              {/* Basic Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Título *</label>
                  <input
                    type="text"
                    value={productFormData.title}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Nome do PC"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Subtítulo</label>
                  <input
                    type="text"
                    value={productFormData.subtitle}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Descrição curta"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Mídia (Fotos e Vídeos)</label>
                <div className="mb-4 flex flex-wrap gap-4">
                  {productFormData.media.map((item, i) => (
                    <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg bg-secondary">
                      {item.type === 'video' ? (
                        <video src={item.url} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={item.url} alt={`Media ${i + 1}`} className="h-full w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 rounded bg-background/80 px-1 text-xs">
                        {item.type === 'video' ? <Play className="h-3 w-3" /> : <Image className="h-3 w-3" />}
                      </div>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Upload className="h-6 w-6" />
                    <span className="mt-1 text-xs">Adicionar</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Component Selection - Step by Step */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Componentes Obrigatórios</h3>
                
                {/* Progress indicators */}
                <div className="flex flex-wrap gap-2">
                  {componentSteps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = !!productFormData.components[step.key as keyof ProductComponents];
                    const currentStepIndex = componentSteps.findIndex(
                      s => !productFormData.components[s.key as keyof ProductComponents]
                    );
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors ${
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : isCurrent
                            ? 'bg-primary/20 text-primary border border-primary'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{step.label}</span>
                        {isCompleted && <span>✓</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Current step selection */}
                {(() => {
                  const currentStepIndex = componentSteps.findIndex(
                    s => !productFormData.components[s.key as keyof ProductComponents]
                  );
                  
                  // All steps completed
                  if (currentStepIndex === -1) {
                    return (
                      <div className="rounded-xl border border-primary bg-primary/10 p-6 text-center">
                        <p className="text-lg font-semibold text-primary">Todos os componentes selecionados!</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Você pode clicar nos componentes abaixo para alterar a seleção.
                        </p>
                        
                        {/* Show all selected components for editing */}
                        <div className="mt-4 space-y-3 text-left">
                          {componentSteps.map(step => {
                            const Icon = step.icon;
                            const selected = productFormData.components[step.key as keyof ProductComponents];
                            if (!selected) return null;
                            
                            return (
                              <div
                                key={step.key}
                                onClick={() => selectComponent(step.key, undefined)}
                                className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-destructive hover:bg-destructive/10"
                              >
                                <div className="flex items-center gap-3">
                                  <Icon className="h-5 w-5 text-primary" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                                    <p className="text-sm text-muted-foreground">{selected.brand} {selected.model}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-primary">{formatPrice(selected.price)}</span>
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  
                  const currentStep = componentSteps[currentStepIndex];
                  const Icon = currentStep.icon;
                  const items = (hardware[currentStep.key] || []).sort((a, b) => a.price - b.price);
                  
                  return (
                    <div className="rounded-xl border border-primary bg-card p-4">
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {currentStepIndex + 1}
                        </div>
                        <Icon className="h-5 w-5 text-primary" />
                        <h4 className="font-medium text-foreground">Selecione o {currentStep.label}</h4>
                        <span className="ml-auto text-sm text-muted-foreground">
                          Passo {currentStepIndex + 1} de {componentSteps.length}
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum {currentStep.label.toLowerCase()} cadastrado. Adicione na aba Hardware.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                          {items.map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => selectComponent(currentStep.key, item)}
                              className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary/5"
                            >
                              <div className="flex items-center gap-4">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-foreground">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">{item.brand} {item.model}</p>
                                </div>
                              </div>
                              <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Show already selected components */}
                      {currentStepIndex > 0 && (
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">Já selecionados:</p>
                          <div className="flex flex-wrap gap-2">
                            {componentSteps.slice(0, currentStepIndex).map(step => {
                              const StepIcon = step.icon;
                              const selected = productFormData.components[step.key as keyof ProductComponents];
                              if (!selected) return null;
                              
                              return (
                                <div
                                  key={step.key}
                                  onClick={() => selectComponent(step.key, undefined)}
                                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm transition-colors hover:bg-destructive/20"
                                >
                                  <StepIcon className="h-4 w-4 text-primary" />
                                  <span className="text-foreground">{selected.brand} {selected.model}</span>
                                  <span className="text-primary">{formatPrice(selected.price)}</span>
                                  <X className="h-3 w-3 text-muted-foreground" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Total Price */}
              <div className="rounded-xl bg-primary/10 p-6 text-center">
                <p className="text-sm text-muted-foreground">Preço Total</p>
                <p className="text-4xl font-bold text-primary">{formatPrice(productFormData.totalPrice)}</p>
              </div>

              {/* Categories */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Categorias</label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {productFormData.categories.map((cat, i) => (
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
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
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

              {/* Extra Specs */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Especificações Extras</label>
                <div className="mb-2 space-y-2">
                  {Object.entries(productFormData.specs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2">
                      <span className="text-foreground">
                        <strong>{key}:</strong> {value}
                      </span>
                      <button type="button" onClick={() => removeProductSpec(key)} className="text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProductSpecKey}
                    onChange={(e) => setNewProductSpecKey(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Chave"
                  />
                  <input
                    type="text"
                    value={newProductSpecValue}
                    onChange={(e) => setNewProductSpecValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Valor"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addProductSpec())}
                  />
                  <button
                    type="button"
                    onClick={addProductSpec}
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
                  Salvar PC
                </button>
                <button
                  type="button"
                  onClick={closeProductEditor}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hardware Editor Modal */}
      {isEditingHardware && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-background/80 backdrop-blur-sm p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                {editingHardwareId ? "Editar Hardware" : "Novo Hardware"}
              </h2>
              <button onClick={closeHardwareEditor} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleHardwareSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Categoria *</label>
                <select
                  value={hardwareFormData.category}
                  onChange={(e) => setHardwareFormData(prev => ({ ...prev, category: e.target.value as HardwareCategory }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                >
                  {hardwareCategories.map(cat => (
                    <option key={cat.key} value={cat.key}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Nome *</label>
                  <input
                    type="text"
                    value={hardwareFormData.name}
                    onChange={(e) => setHardwareFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Nome do componente"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Marca *</label>
                  <input
                    type="text"
                    value={hardwareFormData.brand}
                    onChange={(e) => setHardwareFormData(prev => ({ ...prev, brand: e.target.value }))}
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
                    value={hardwareFormData.model}
                    onChange={(e) => setHardwareFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Ex: Core i7-13700K"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={hardwareFormData.price}
                    onChange={(e) => setHardwareFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>


              {/* Specs */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Especificações</label>
                <div className="mb-2 space-y-2">
                  {Object.entries(hardwareFormData.specs).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2">
                      <span className="text-foreground">
                        <strong>{key}:</strong> {value}
                      </span>
                      <button type="button" onClick={() => removeHardwareSpec(key)} className="text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHardwareSpecKey}
                    onChange={(e) => setNewHardwareSpecKey(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Chave"
                  />
                  <input
                    type="text"
                    value={newHardwareSpecValue}
                    onChange={(e) => setNewHardwareSpecValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Valor"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHardwareSpec())}
                  />
                  <button
                    type="button"
                    onClick={addHardwareSpec}
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
                  onClick={closeHardwareEditor}
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
