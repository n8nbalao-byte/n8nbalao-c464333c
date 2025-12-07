import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sidebar } from "@/components/Sidebar";
import { api, type Product, type HardwareItem, type MediaItem, type ProductComponents, type CompanyData, type ProductCategory, type HardwareCategory, getCustomCategories, addCustomCategory, removeCustomCategory, saveCustomCategories } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, X, Upload, Play, Image, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box, Package, Download, Droplets, Building2, Laptop, Bot, Code, Wrench, Key, Tv, Armchair, Tag, Gamepad2, Headphones, Keyboard, Mouse, Printer, Wifi, Camera, Speaker, Smartphone, Watch, ShoppingBag, Gift, Star, Heart, Award, Crown, Shield, Rocket, Sparkles, Flame, Leaf, Sun, Moon, Cloud, Umbrella, Anchor, Compass, Map, Globe, Flag, Bookmark, Briefcase, Clock, Calendar, Bell, Mail, MessageSquare, Phone, Video, Music, Film, BookOpen, FileText, Folder, Database, Server, Terminal, Settings, Hammer, PenTool, Scissors, Paintbrush, Palette, LucideIcon } from "lucide-react";
import * as XLSX from "xlsx";

// Available icons for custom categories
const availableIcons: { key: string; icon: LucideIcon }[] = [
  { key: 'tag', icon: Tag },
  { key: 'gamepad2', icon: Gamepad2 },
  { key: 'headphones', icon: Headphones },
  { key: 'keyboard', icon: Keyboard },
  { key: 'mouse', icon: Mouse },
  { key: 'printer', icon: Printer },
  { key: 'wifi', icon: Wifi },
  { key: 'camera', icon: Camera },
  { key: 'speaker', icon: Speaker },
  { key: 'smartphone', icon: Smartphone },
  { key: 'watch', icon: Watch },
  { key: 'shopping-bag', icon: ShoppingBag },
  { key: 'gift', icon: Gift },
  { key: 'star', icon: Star },
  { key: 'heart', icon: Heart },
  { key: 'award', icon: Award },
  { key: 'crown', icon: Crown },
  { key: 'shield', icon: Shield },
  { key: 'rocket', icon: Rocket },
  { key: 'sparkles', icon: Sparkles },
  { key: 'flame', icon: Flame },
  { key: 'leaf', icon: Leaf },
  { key: 'sun', icon: Sun },
  { key: 'moon', icon: Moon },
  { key: 'cloud', icon: Cloud },
  { key: 'umbrella', icon: Umbrella },
  { key: 'anchor', icon: Anchor },
  { key: 'compass', icon: Compass },
  { key: 'map', icon: Map },
  { key: 'globe', icon: Globe },
  { key: 'flag', icon: Flag },
  { key: 'bookmark', icon: Bookmark },
  { key: 'briefcase', icon: Briefcase },
  { key: 'clock', icon: Clock },
  { key: 'calendar', icon: Calendar },
  { key: 'bell', icon: Bell },
  { key: 'mail', icon: Mail },
  { key: 'message-square', icon: MessageSquare },
  { key: 'phone', icon: Phone },
  { key: 'video', icon: Video },
  { key: 'music', icon: Music },
  { key: 'film', icon: Film },
  { key: 'book-open', icon: BookOpen },
  { key: 'file-text', icon: FileText },
  { key: 'folder', icon: Folder },
  { key: 'database', icon: Database },
  { key: 'server', icon: Server },
  { key: 'terminal', icon: Terminal },
  { key: 'settings', icon: Settings },
  { key: 'wrench', icon: Wrench },
  { key: 'hammer', icon: Hammer },
  { key: 'pen-tool', icon: PenTool },
  { key: 'scissors', icon: Scissors },
  { key: 'paintbrush', icon: Paintbrush },
  { key: 'palette', icon: Palette },
  { key: 'monitor', icon: Monitor },
  { key: 'laptop', icon: Laptop },
  { key: 'cpu', icon: Cpu },
  { key: 'box', icon: Box },
  { key: 'package', icon: Package },
];
import { HardwareCard } from "@/components/HardwareCard";

// Simple auth - for demo purposes only
const ADMIN_USER = "n8nbalao";
const ADMIN_PASS = "Balao2025";

type AdminTab = 'products' | 'hardware' | 'company' | 'categories';

interface ProductFormData {
  title: string;
  subtitle: string;
  categories: string[];
  media: MediaItem[];
  specs: Record<string, string>;
  components: ProductComponents;
  totalPrice: number;
  productType: ProductCategory;
  downloadUrl: string;
}

interface HardwareFormData {
  name: string;
  brand: string;
  model: string;
  price: number;
  image: string;
  specs: Record<string, string>;
  category: HardwareCategory;
  // Compatibility fields
  socket?: string;
  memoryType?: string;
  formFactor?: string;
  tdp?: number;
}

// Compatibility options
const socketOptions = [
  { value: 'LGA1700', label: 'Intel LGA 1700 (12ª-14ª Gen)' },
  { value: 'LGA1200', label: 'Intel LGA 1200 (10ª-11ª Gen)' },
  { value: 'AM5', label: 'AMD AM5 (Ryzen 7000+)' },
  { value: 'AM4', label: 'AMD AM4 (Ryzen 1000-5000)' },
];

const memoryTypeOptions = [
  { value: 'DDR5', label: 'DDR5' },
  { value: 'DDR4', label: 'DDR4' },
];

const formFactorOptions = [
  { value: 'ATX', label: 'ATX' },
  { value: 'Micro-ATX', label: 'Micro-ATX' },
  { value: 'Mini-ITX', label: 'Mini-ITX' },
  { value: 'E-ATX', label: 'E-ATX' },
];

const defaultProductFormData: ProductFormData = {
  title: "",
  subtitle: "",
  categories: [],
  media: [],
  specs: {},
  components: {},
  totalPrice: 0,
  productType: "pc",
  downloadUrl: "",
};

const defaultHardwareFormData: HardwareFormData = {
  name: "",
  brand: "",
  model: "",
  price: 0,
  image: "",
  specs: {},
  category: "processor",
  socket: "",
  memoryType: "",
  formFactor: "",
  tdp: 0,
};

// PC component steps (hardware) - all 8 components
const componentSteps = [
  { key: 'processor', label: 'Processador', icon: Cpu },
  { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
  { key: 'cooler', label: 'Cooler', icon: Droplets },
  { key: 'psu', label: 'Fonte', icon: Zap },
  { key: 'case', label: 'Gabinete', icon: Box },
] as const;

// Kit component steps - only processor, motherboard, memory
const kitComponentSteps = [
  { key: 'processor', label: 'Processador', icon: Cpu },
  { key: 'motherboard', label: 'Placa-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
] as const;

// Hardware categories (PC components only)
const hardwareCategories: { key: HardwareCategory; label: string; icon: React.ElementType }[] = [
  { key: 'processor', label: 'Processadores', icon: Cpu },
  { key: 'motherboard', label: 'Placas-Mãe', icon: CircuitBoard },
  { key: 'memory', label: 'Memória RAM', icon: MemoryStick },
  { key: 'storage', label: 'Armazenamento', icon: HardDrive },
  { key: 'gpu', label: 'Placas de Vídeo', icon: Monitor },
  { key: 'psu', label: 'Fontes', icon: Zap },
  { key: 'case', label: 'Gabinetes', icon: Box },
  { key: 'cooler', label: 'Coolers', icon: Droplets },
];

// Product types for simple products (not PC assembly)
const baseProductTypes: { key: ProductCategory; label: string; icon: React.ElementType }[] = [
  { key: 'pc', label: 'PC Montado', icon: Monitor },
  { key: 'kit', label: 'Kit', icon: Package },
  { key: 'notebook', label: 'Notebook', icon: Laptop },
  { key: 'automacao', label: 'Automação', icon: Bot },
  { key: 'software', label: 'Software', icon: Code },
  { key: 'acessorio', label: 'Acessório', icon: Wrench },
  { key: 'licenca', label: 'Licença', icon: Key },
  { key: 'monitor', label: 'Monitor', icon: Tv },
  { key: 'cadeira_gamer', label: 'Cadeira Gamer', icon: Armchair },
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

  // Company state
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
  const [savingCompany, setSavingCompany] = useState(false);

  // Custom categories state
  const [customCategoriesList, setCustomCategoriesList] = useState<{ key: string; label: string; icon?: string }[]>([]);
  const [newCategoryKey, setNewCategoryKey] = useState("");
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("tag");
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [inlineNewCategoryKey, setInlineNewCategoryKey] = useState("");
  const [inlineNewCategoryLabel, setInlineNewCategoryLabel] = useState("");
  const [inlineNewCategoryIcon, setInlineNewCategoryIcon] = useState("tag");

  // Helper to get icon component from key
  const getIconFromKey = (iconKey: string): React.ElementType => {
    const found = availableIcons.find(i => i.key === iconKey);
    return found ? found.icon : Tag;
  };

  // Merge base categories with custom categories
  const productTypes = [
    ...baseProductTypes,
    ...customCategoriesList.map(c => ({ key: c.key as ProductCategory, label: c.label, icon: getIconFromKey(c.icon || 'tag') }))
  ];

  // Load custom categories on mount
  useEffect(() => {
    setCustomCategoriesList(getCustomCategories());
  }, []);

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
      } else if (activeTab === 'hardware') {
        fetchHardwareData();
      } else if (activeTab === 'company') {
        fetchCompanyData();
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

  async function fetchCompanyData() {
    setLoading(true);
    const data = await api.getCompany();
    setCompanyData(data);
    setLoading(false);
  }

  async function handleCompanySave() {
    setSavingCompany(true);
    const success = await api.saveCompany(companyData);
    if (success) {
      toast({ title: "Sucesso", description: "Dados da empresa salvos!" });
    } else {
      toast({ title: "Erro", description: "Falha ao salvar dados", variant: "destructive" });
    }
    setSavingCompany(false);
  }

  function handleCompanyLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyData(prev => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
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

  // Compress image to reduce size
  function compressImage(file: File, maxWidth: number = 800, quality: number = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // Product functions
  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith('video/')) {
          // Check video size - max 5MB for base64 videos
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: "Vídeo muito grande",
              description: "Vídeos devem ter no máximo 5MB. Use URL do YouTube para vídeos maiores.",
              variant: "destructive"
            });
            continue;
          }
          
          const reader = new FileReader();
          reader.onloadend = () => {
            setProductFormData(prev => ({
              ...prev,
              media: [...prev.media, { type: 'video', url: reader.result as string }],
            }));
          };
          reader.readAsDataURL(file);
        } else {
          // Compress images
          const compressedUrl = await compressImage(file);
          setProductFormData(prev => ({
            ...prev,
            media: [...prev.media, { type: 'image', url: compressedUrl }],
          }));
        }
      } catch (error) {
        console.error('Error processing media:', error);
        toast({
          title: "Erro ao processar mídia",
          description: "Não foi possível processar o arquivo.",
          variant: "destructive"
        });
      }
    }
  }

  const [videoUrlInput, setVideoUrlInput] = useState("");

  function addVideoByUrl() {
    if (!videoUrlInput.trim()) return;
    
    let videoUrl = videoUrlInput.trim();
    
    // Convert YouTube URLs to embed format
    if (videoUrl.includes('youtube.com/watch')) {
      const videoId = new URL(videoUrl).searchParams.get('v');
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      }
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
      }
    }
    
    setProductFormData(prev => ({
      ...prev,
      media: [...prev.media, { type: 'video', url: videoUrl }],
    }));
    setVideoUrlInput("");
  }

  // Hardware image upload
  async function handleHardwareImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedUrl = await compressImage(file);
      setHardwareFormData(prev => ({ ...prev, image: compressedUrl }));
    } catch (error) {
      console.error('Error compressing hardware image:', error);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHardwareFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
        productType: product.productType || "pc",
        downloadUrl: product.downloadUrl || "",
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

    // Validate components for PC type
    if (productFormData.productType === 'pc') {
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
    }

    // Validate components for Kit type (only processor, motherboard, memory)
    if (productFormData.productType === 'kit') {
      const missingComponents = kitComponentSteps.filter(
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
    }

    // For non-PC/Kit products, ensure price is set
    if (!['pc', 'kit'].includes(productFormData.productType) && productFormData.totalPrice <= 0) {
      toast({ title: "Erro", description: "Defina o preço do produto", variant: "destructive" });
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
        socket: item.socket || "",
        memoryType: item.memoryType || "",
        formFactor: item.formFactor || "",
        tdp: item.tdp || 0,
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

  // Test data by hardware category with real images
  const testHardwareData: Record<HardwareCategory, Array<{ name: string; brand: string; model: string; price: number; specs: Record<string, string>; image: string; socket?: string; memoryType?: string }>> = {
    processor: [
      { name: "Intel Core i9-14900K", brand: "Intel", model: "i9-14900K", price: 3499, specs: { "Núcleos": "24", "Threads": "32", "Frequência": "3.2GHz" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", socket: "LGA1700" },
      { name: "Intel Core i7-14700K", brand: "Intel", model: "i7-14700K", price: 2499, specs: { "Núcleos": "20", "Threads": "28", "Frequência": "3.4GHz" }, image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=400&fit=crop", socket: "LGA1700" },
      { name: "Intel Core i5-14600K", brand: "Intel", model: "i5-14600K", price: 1799, specs: { "Núcleos": "14", "Threads": "20", "Frequência": "3.5GHz" }, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop", socket: "LGA1700" },
      { name: "AMD Ryzen 9 7950X", brand: "AMD", model: "Ryzen 9 7950X", price: 3299, specs: { "Núcleos": "16", "Threads": "32", "Frequência": "4.5GHz" }, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&h=400&fit=crop", socket: "AM5" },
      { name: "AMD Ryzen 7 7800X3D", brand: "AMD", model: "Ryzen 7 7800X3D", price: 2599, specs: { "Núcleos": "8", "Threads": "16", "Frequência": "4.2GHz" }, image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=400&fit=crop", socket: "AM5" },
      { name: "AMD Ryzen 5 7600X", brand: "AMD", model: "Ryzen 5 7600X", price: 1399, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "4.7GHz" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", socket: "AM5" },
      { name: "Intel Core i3-14100", brand: "Intel", model: "i3-14100", price: 899, specs: { "Núcleos": "4", "Threads": "8", "Frequência": "3.5GHz" }, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop", socket: "LGA1700" },
      { name: "AMD Ryzen 5 5600G", brand: "AMD", model: "Ryzen 5 5600G", price: 999, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "3.9GHz" }, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&h=400&fit=crop", socket: "AM4" },
      { name: "Intel Core i5-12400F", brand: "Intel", model: "i5-12400F", price: 1099, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "2.5GHz" }, image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=400&fit=crop", socket: "LGA1700" },
      { name: "AMD Ryzen 9 5900X", brand: "AMD", model: "Ryzen 9 5900X", price: 2199, specs: { "Núcleos": "12", "Threads": "24", "Frequência": "3.7GHz" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", socket: "AM4" },
    ],
    motherboard: [
      { name: "ASUS ROG Maximus Z790", brand: "ASUS", model: "ROG Maximus Z790", price: 3999, specs: { "Socket": "LGA1700", "Chipset": "Z790", "RAM": "DDR5" }, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop", socket: "LGA1700", memoryType: "DDR5" },
      { name: "ASUS TUF Gaming B760", brand: "ASUS", model: "TUF Gaming B760-Plus", price: 1299, specs: { "Socket": "LGA1700", "Chipset": "B760", "RAM": "DDR5" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", socket: "LGA1700", memoryType: "DDR5" },
      { name: "Gigabyte Z790 Aorus Elite", brand: "Gigabyte", model: "Z790 Aorus Elite", price: 2499, specs: { "Socket": "LGA1700", "Chipset": "Z790", "RAM": "DDR5" }, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&h=400&fit=crop", socket: "LGA1700", memoryType: "DDR5" },
      { name: "MSI MAG B650 Tomahawk", brand: "MSI", model: "MAG B650 Tomahawk", price: 1599, specs: { "Socket": "AM5", "Chipset": "B650", "RAM": "DDR5" }, image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=400&fit=crop", socket: "AM5", memoryType: "DDR5" },
      { name: "ASUS ROG Strix X670E-E", brand: "ASUS", model: "ROG Strix X670E-E", price: 3499, specs: { "Socket": "AM5", "Chipset": "X670E", "RAM": "DDR5" }, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop", socket: "AM5", memoryType: "DDR5" },
      { name: "Gigabyte B550 Aorus Pro", brand: "Gigabyte", model: "B550 Aorus Pro V2", price: 999, specs: { "Socket": "AM4", "Chipset": "B550", "RAM": "DDR4" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", socket: "AM4", memoryType: "DDR4" },
      { name: "MSI MPG Z790 Carbon", brand: "MSI", model: "MPG Z790 Carbon WiFi", price: 2999, specs: { "Socket": "LGA1700", "Chipset": "Z790", "RAM": "DDR5" }, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&h=400&fit=crop", socket: "LGA1700", memoryType: "DDR5" },
      { name: "ASRock B660M Pro RS", brand: "ASRock", model: "B660M Pro RS", price: 699, specs: { "Socket": "LGA1700", "Chipset": "B660", "RAM": "DDR4" }, image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=400&fit=crop", socket: "LGA1700", memoryType: "DDR4" },
      { name: "ASUS Prime A520M-K", brand: "ASUS", model: "Prime A520M-K", price: 449, specs: { "Socket": "AM4", "Chipset": "A520", "RAM": "DDR4" }, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop", socket: "AM4", memoryType: "DDR4" },
      { name: "Gigabyte X670E Aorus Master", brand: "Gigabyte", model: "X670E Aorus Master", price: 3799, specs: { "Socket": "AM5", "Chipset": "X670E", "RAM": "DDR5" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", socket: "AM5", memoryType: "DDR5" },
    ],
    memory: [
      { name: "Corsair Vengeance DDR5 32GB", brand: "Corsair", model: "CMK32GX5M2B5600C36", price: 899, specs: { "Capacidade": "32GB", "Tipo": "DDR5", "Velocidade": "5600MHz" }, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&h=400&fit=crop", memoryType: "DDR5" },
      { name: "G.Skill Trident Z5 RGB 32GB", brand: "G.Skill", model: "F5-6000J3038F16GX2", price: 1099, specs: { "Capacidade": "32GB", "Tipo": "DDR5", "Velocidade": "6000MHz" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", memoryType: "DDR5" },
      { name: "Kingston Fury Beast 16GB", brand: "Kingston", model: "KF560C36BBK2-16", price: 499, specs: { "Capacidade": "16GB", "Tipo": "DDR5", "Velocidade": "6000MHz" }, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop", memoryType: "DDR5" },
      { name: "Corsair Vengeance DDR4 16GB", brand: "Corsair", model: "CMK16GX4M2B3200C16", price: 349, specs: { "Capacidade": "16GB", "Tipo": "DDR4", "Velocidade": "3200MHz" }, image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=400&fit=crop", memoryType: "DDR4" },
      { name: "G.Skill Ripjaws V 32GB", brand: "G.Skill", model: "F4-3600C16D-32GVKC", price: 549, specs: { "Capacidade": "32GB", "Tipo": "DDR4", "Velocidade": "3600MHz" }, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&h=400&fit=crop", memoryType: "DDR4" },
      { name: "Kingston Fury Beast DDR4 8GB", brand: "Kingston", model: "KF432C16BB/8", price: 189, specs: { "Capacidade": "8GB", "Tipo": "DDR4", "Velocidade": "3200MHz" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", memoryType: "DDR4" },
      { name: "Corsair Dominator Platinum 64GB", brand: "Corsair", model: "CMT64GX5M2X5600C40", price: 2299, specs: { "Capacidade": "64GB", "Tipo": "DDR5", "Velocidade": "5600MHz" }, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop", memoryType: "DDR5" },
      { name: "Team T-Force Delta RGB 32GB", brand: "TeamGroup", model: "FF3D532G6000HC38ADC01", price: 799, specs: { "Capacidade": "32GB", "Tipo": "DDR5", "Velocidade": "6000MHz" }, image: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400&h=400&fit=crop", memoryType: "DDR5" },
      { name: "Crucial DDR4 16GB", brand: "Crucial", model: "CT16G4DFRA32A", price: 279, specs: { "Capacidade": "16GB", "Tipo": "DDR4", "Velocidade": "3200MHz" }, image: "https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&h=400&fit=crop", memoryType: "DDR4" },
      { name: "HyperX Fury 8GB", brand: "HyperX", model: "HX432C16FB3/8", price: 199, specs: { "Capacidade": "8GB", "Tipo": "DDR4", "Velocidade": "3200MHz" }, image: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=400&fit=crop", memoryType: "DDR4" },
    ],
    storage: [
      { name: "Samsung 990 Pro 2TB", brand: "Samsung", model: "MZ-V9P2T0B/AM", price: 1299, specs: { "Capacidade": "2TB", "Tipo": "NVMe SSD", "Leitura": "7450MB/s" }, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop" },
      { name: "Samsung 980 Pro 1TB", brand: "Samsung", model: "MZ-V8P1T0B/AM", price: 699, specs: { "Capacidade": "1TB", "Tipo": "NVMe SSD", "Leitura": "7000MB/s" }, image: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=400&h=400&fit=crop" },
      { name: "WD Black SN850X 2TB", brand: "Western Digital", model: "WDS200T2X0E", price: 1199, specs: { "Capacidade": "2TB", "Tipo": "NVMe SSD", "Leitura": "7300MB/s" }, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop" },
      { name: "Kingston NV2 1TB", brand: "Kingston", model: "SNV2S/1000G", price: 399, specs: { "Capacidade": "1TB", "Tipo": "NVMe SSD", "Leitura": "3500MB/s" }, image: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=400&h=400&fit=crop" },
      { name: "Crucial P3 Plus 2TB", brand: "Crucial", model: "CT2000P3PSSD8", price: 799, specs: { "Capacidade": "2TB", "Tipo": "NVMe SSD", "Leitura": "5000MB/s" }, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop" },
      { name: "Samsung 870 EVO 1TB", brand: "Samsung", model: "MZ-77E1T0B/AM", price: 499, specs: { "Capacidade": "1TB", "Tipo": "SATA SSD", "Leitura": "560MB/s" }, image: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=400&h=400&fit=crop" },
      { name: "Seagate Barracuda 4TB", brand: "Seagate", model: "ST4000DM004", price: 549, specs: { "Capacidade": "4TB", "Tipo": "HDD", "RPM": "5400" }, image: "https://images.unsplash.com/photo-1531492746076-161ca9bcad09?w=400&h=400&fit=crop" },
      { name: "WD Blue 1TB SSD", brand: "Western Digital", model: "WDS100T3B0A", price: 399, specs: { "Capacidade": "1TB", "Tipo": "SATA SSD", "Leitura": "560MB/s" }, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop" },
      { name: "Corsair MP600 Pro 2TB", brand: "Corsair", model: "CSSD-F2000GBMP600PRO", price: 1599, specs: { "Capacidade": "2TB", "Tipo": "NVMe SSD", "Leitura": "7100MB/s" }, image: "https://images.unsplash.com/photo-1628557044797-f21a177c37ec?w=400&h=400&fit=crop" },
      { name: "Kingston A400 480GB", brand: "Kingston", model: "SA400S37/480G", price: 249, specs: { "Capacidade": "480GB", "Tipo": "SATA SSD", "Leitura": "500MB/s" }, image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&h=400&fit=crop" },
    ],
    gpu: [
      { name: "NVIDIA RTX 4090", brand: "NVIDIA", model: "GeForce RTX 4090", price: 12999, specs: { "VRAM": "24GB GDDR6X", "CUDA Cores": "16384", "Boost": "2.52GHz" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "NVIDIA RTX 4080 Super", brand: "NVIDIA", model: "GeForce RTX 4080 Super", price: 8999, specs: { "VRAM": "16GB GDDR6X", "CUDA Cores": "10240", "Boost": "2.55GHz" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "NVIDIA RTX 4070 Ti Super", brand: "NVIDIA", model: "GeForce RTX 4070 Ti Super", price: 5999, specs: { "VRAM": "16GB GDDR6X", "CUDA Cores": "8448", "Boost": "2.61GHz" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "NVIDIA RTX 4070 Super", brand: "NVIDIA", model: "GeForce RTX 4070 Super", price: 4499, specs: { "VRAM": "12GB GDDR6X", "CUDA Cores": "7168", "Boost": "2.48GHz" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "NVIDIA RTX 4060 Ti", brand: "NVIDIA", model: "GeForce RTX 4060 Ti", price: 2999, specs: { "VRAM": "8GB GDDR6", "CUDA Cores": "4352", "Boost": "2.54GHz" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "NVIDIA RTX 4060", brand: "NVIDIA", model: "GeForce RTX 4060", price: 2199, specs: { "VRAM": "8GB GDDR6", "CUDA Cores": "3072", "Boost": "2.46GHz" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "AMD RX 7900 XTX", brand: "AMD", model: "Radeon RX 7900 XTX", price: 7499, specs: { "VRAM": "24GB GDDR6", "Stream Processors": "6144", "Boost": "2.5GHz" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "AMD RX 7800 XT", brand: "AMD", model: "Radeon RX 7800 XT", price: 3999, specs: { "VRAM": "16GB GDDR6", "Stream Processors": "3840", "Boost": "2.43GHz" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "AMD RX 7600", brand: "AMD", model: "Radeon RX 7600", price: 1999, specs: { "VRAM": "8GB GDDR6", "Stream Processors": "2048", "Boost": "2.66GHz" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "NVIDIA RTX 3060", brand: "NVIDIA", model: "GeForce RTX 3060", price: 1899, specs: { "VRAM": "12GB GDDR6", "CUDA Cores": "3584", "Boost": "1.78GHz" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
    ],
    psu: [
      { name: "Corsair RM1000x", brand: "Corsair", model: "RM1000x", price: 1199, specs: { "Potência": "1000W", "Certificação": "80+ Gold", "Modular": "Full" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Corsair RM850x", brand: "Corsair", model: "RM850x", price: 899, specs: { "Potência": "850W", "Certificação": "80+ Gold", "Modular": "Full" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "EVGA SuperNOVA 750 G6", brand: "EVGA", model: "SuperNOVA 750 G6", price: 699, specs: { "Potência": "750W", "Certificação": "80+ Gold", "Modular": "Full" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Seasonic Focus GX-850", brand: "Seasonic", model: "Focus GX-850", price: 799, specs: { "Potência": "850W", "Certificação": "80+ Gold", "Modular": "Full" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "Cooler Master V850 Gold", brand: "Cooler Master", model: "V850 Gold V2", price: 749, specs: { "Potência": "850W", "Certificação": "80+ Gold", "Modular": "Full" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "be quiet! Straight Power 11 750W", brand: "be quiet!", model: "Straight Power 11", price: 699, specs: { "Potência": "750W", "Certificação": "80+ Platinum", "Modular": "Full" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "ASUS ROG Thor 1200W", brand: "ASUS", model: "ROG Thor 1200P2", price: 2299, specs: { "Potência": "1200W", "Certificação": "80+ Platinum", "Modular": "Full" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Corsair CV650", brand: "Corsair", model: "CV650", price: 349, specs: { "Potência": "650W", "Certificação": "80+ Bronze", "Modular": "Não" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "EVGA 600 BR", brand: "EVGA", model: "600 BR", price: 299, specs: { "Potência": "600W", "Certificação": "80+ Bronze", "Modular": "Não" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "XPG Core Reactor 750W", brand: "XPG", model: "Core Reactor 750", price: 599, specs: { "Potência": "750W", "Certificação": "80+ Gold", "Modular": "Full" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
    ],
    case: [
      { name: "NZXT H7 Flow", brand: "NZXT", model: "H7 Flow", price: 899, specs: { "Formato": "Mid-Tower", "Cor": "Preto", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Corsair 4000D Airflow", brand: "Corsair", model: "4000D Airflow", price: 599, specs: { "Formato": "Mid-Tower", "Cor": "Preto", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "Lian Li O11 Dynamic", brand: "Lian Li", model: "O11 Dynamic", price: 899, specs: { "Formato": "Mid-Tower", "Cor": "Branco", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Fractal Design Meshify 2", brand: "Fractal Design", model: "Meshify 2", price: 999, specs: { "Formato": "Mid-Tower", "Cor": "Preto", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "Phanteks Eclipse P400A", brand: "Phanteks", model: "Eclipse P400A", price: 449, specs: { "Formato": "Mid-Tower", "Cor": "Preto", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Cooler Master MasterBox Q300L", brand: "Cooler Master", model: "MasterBox Q300L", price: 299, specs: { "Formato": "Micro-ATX", "Cor": "Preto", "Vidro": "Acrílico" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "be quiet! Pure Base 500DX", brand: "be quiet!", model: "Pure Base 500DX", price: 699, specs: { "Formato": "Mid-Tower", "Cor": "Preto", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "ASUS TUF Gaming GT301", brand: "ASUS", model: "TUF Gaming GT301", price: 499, specs: { "Formato": "Mid-Tower", "Cor": "Preto", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "Thermaltake Core P3", brand: "Thermaltake", model: "Core P3", price: 799, specs: { "Formato": "Open Frame", "Cor": "Preto", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "MSI MAG Forge 100R", brand: "MSI", model: "MAG Forge 100R", price: 399, specs: { "Formato": "Mid-Tower", "Cor": "Preto", "Vidro": "Temperado" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
    ],
    cooler: [
      { name: "NZXT Kraken Z73", brand: "NZXT", model: "Kraken Z73", price: 1999, specs: { "Tipo": "AIO 360mm", "Display": "LCD", "RGB": "Sim" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Corsair iCUE H150i Elite", brand: "Corsair", model: "iCUE H150i Elite", price: 1499, specs: { "Tipo": "AIO 360mm", "Display": "Não", "RGB": "Sim" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "NZXT Kraken X63", brand: "NZXT", model: "Kraken X63", price: 999, specs: { "Tipo": "AIO 280mm", "Display": "Não", "RGB": "Sim" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Cooler Master MasterLiquid ML360R", brand: "Cooler Master", model: "ML360R RGB", price: 899, specs: { "Tipo": "AIO 360mm", "Display": "Não", "RGB": "Sim" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "be quiet! Dark Rock Pro 4", brand: "be quiet!", model: "Dark Rock Pro 4", price: 499, specs: { "Tipo": "Air Cooler", "TDP": "250W", "RGB": "Não" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Noctua NH-D15", brand: "Noctua", model: "NH-D15", price: 599, specs: { "Tipo": "Air Cooler", "TDP": "250W", "RGB": "Não" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "Deepcool AK620", brand: "Deepcool", model: "AK620", price: 349, specs: { "Tipo": "Air Cooler", "TDP": "260W", "RGB": "Não" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Corsair H100i RGB Pro XT", brand: "Corsair", model: "H100i RGB Pro XT", price: 799, specs: { "Tipo": "AIO 240mm", "Display": "Não", "RGB": "Sim" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
      { name: "Arctic Liquid Freezer II 360", brand: "Arctic", model: "Liquid Freezer II 360", price: 699, specs: { "Tipo": "AIO 360mm", "Display": "Não", "RGB": "Não" }, image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&h=400&fit=crop" },
      { name: "Cooler Master Hyper 212 Black", brand: "Cooler Master", model: "Hyper 212 Black", price: 199, specs: { "Tipo": "Air Cooler", "TDP": "150W", "RGB": "Não" }, image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&h=400&fit=crop" },
    ],
  };

  // Test product images by category (placeholder images from picsum.photos)
  const testProductImages: Partial<Record<ProductCategory, string[]>> = {
    pc: [],
    kit: [],
    notebook: [
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1504707748692-419802cf939d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1544099858-75feeb57f01b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=800&h=600&fit=crop",
    ],
    software: [
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
    ],
    automacao: [
      "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1675557009875-436f7a5c6f9e?w=800&h=600&fit=crop",
    ],
    acessorio: [
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1625794084867-8ddd239946b1?w=800&h=600&fit=crop",
    ],
    licenca: [
      "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1618044619888-009e412ff12a?w=800&h=600&fit=crop",
    ],
    monitor: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1551645120-d70bfe84c826?w=800&h=600&fit=crop",
    ],
    cadeira_gamer: [
      "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800&h=600&fit=crop",
    ],
  };

  // Test data by product category
  const testProductData: Partial<Record<ProductCategory, Array<{ title: string; subtitle: string; totalPrice: number; downloadUrl?: string }>>> = {
    pc: [],
    kit: [],
    notebook: [
      { title: "Notebook Gamer RTX 3060", subtitle: "Intel Core i7, 16GB RAM, 512GB SSD", totalPrice: 5999 },
      { title: "Notebook Ultrafino Pro", subtitle: "Intel Core i5, 8GB RAM, 256GB SSD", totalPrice: 3499 },
      { title: "Notebook Workstation", subtitle: "Intel Core i9, 32GB RAM, 1TB SSD", totalPrice: 8999 },
      { title: "Notebook Estudante", subtitle: "AMD Ryzen 5, 8GB RAM, 256GB SSD", totalPrice: 2499 },
      { title: "Notebook Gaming Elite", subtitle: "Intel Core i7, RTX 4070, 16GB RAM", totalPrice: 7999 },
      { title: "Notebook Empresarial", subtitle: "Intel Core i5, 16GB RAM, 512GB SSD", totalPrice: 4299 },
      { title: "Notebook Criador de Conteúdo", subtitle: "AMD Ryzen 7, 32GB RAM, 1TB SSD", totalPrice: 6499 },
      { title: "Notebook Básico", subtitle: "Intel Core i3, 4GB RAM, 128GB SSD", totalPrice: 1899 },
      { title: "Notebook 2 em 1 Touch", subtitle: "Intel Core i5, 8GB RAM, 256GB SSD", totalPrice: 3999 },
      { title: "Notebook MacBook Style", subtitle: "Intel Core i7, 16GB RAM, 512GB SSD", totalPrice: 5499 },
    ],
    software: [
      { title: "Windows 11 Pro", subtitle: "Licença vitalícia", totalPrice: 299 },
      { title: "Office 365 Family", subtitle: "1 ano, até 6 usuários", totalPrice: 449 },
      { title: "Antivírus Premium", subtitle: "Proteção completa 1 ano", totalPrice: 149 },
      { title: "Adobe Creative Cloud", subtitle: "Pacote completo mensal", totalPrice: 299 },
      { title: "AutoCAD LT", subtitle: "Licença anual", totalPrice: 1999 },
      { title: "Visual Studio Pro", subtitle: "Licença vitalícia", totalPrice: 899 },
      { title: "Backup Cloud Pro", subtitle: "1TB armazenamento anual", totalPrice: 199 },
      { title: "VPN Premium", subtitle: "Proteção total 1 ano", totalPrice: 129 },
      { title: "Driver Booster Pro", subtitle: "Atualização automática", totalPrice: 79 },
      { title: "Pacote Produtividade", subtitle: "10 apps essenciais", totalPrice: 249 },
    ],
    automacao: [
      { title: "Bot WhatsApp Básico", subtitle: "Atendimento automático 24/7", totalPrice: 0, downloadUrl: "https://example.com/download/bot-basico" },
      { title: "Bot WhatsApp Pro", subtitle: "IA avançada + integrações", totalPrice: 0, downloadUrl: "https://example.com/download/bot-pro" },
      { title: "Automação E-commerce", subtitle: "Integração com lojas virtuais", totalPrice: 0, downloadUrl: "https://example.com/download/ecommerce" },
      { title: "Bot Agendamento", subtitle: "Sistema de agendamentos automático", totalPrice: 0, downloadUrl: "https://example.com/download/agendamento" },
      { title: "Automação CRM", subtitle: "Gestão de leads e clientes", totalPrice: 0, downloadUrl: "https://example.com/download/crm" },
      { title: "Bot Suporte Técnico", subtitle: "Atendimento N1 automatizado", totalPrice: 0, downloadUrl: "https://example.com/download/suporte" },
      { title: "Automação Marketing", subtitle: "Campanhas e funis automáticos", totalPrice: 0, downloadUrl: "https://example.com/download/marketing" },
      { title: "Bot Vendas", subtitle: "Qualificação e fechamento", totalPrice: 0, downloadUrl: "https://example.com/download/vendas" },
      { title: "Integração N8N", subtitle: "Workflows personalizados", totalPrice: 0, downloadUrl: "https://example.com/download/n8n" },
      { title: "Automação Financeira", subtitle: "Cobranças e notificações", totalPrice: 0, downloadUrl: "https://example.com/download/financeiro" },
    ],
    acessorio: [
      { title: "Mouse Gamer RGB", subtitle: "16000 DPI, 7 botões programáveis", totalPrice: 199 },
      { title: "Teclado Mecânico", subtitle: "Switch Blue, RGB, ABNT2", totalPrice: 349 },
      { title: "Headset Gamer 7.1", subtitle: "Surround, microfone retrátil", totalPrice: 279 },
      { title: "Mousepad XXL", subtitle: "90x40cm, base antiderrapante", totalPrice: 89 },
      { title: "Webcam Full HD", subtitle: "1080p, microfone integrado", totalPrice: 249 },
      { title: "Hub USB 3.0", subtitle: "7 portas, com fonte", totalPrice: 129 },
      { title: "Suporte Monitor Articulado", subtitle: "Até 32 polegadas, VESA", totalPrice: 189 },
      { title: "Fone Bluetooth Premium", subtitle: "ANC, 40h bateria", totalPrice: 399 },
      { title: "Caixa de Som 2.1", subtitle: "50W RMS, subwoofer", totalPrice: 299 },
      { title: "Kit Teclado + Mouse Wireless", subtitle: "Silencioso, pilhas inclusas", totalPrice: 149 },
    ],
    licenca: [
      { title: "Windows 11 Pro", subtitle: "Licença vitalícia original", totalPrice: 299 },
      { title: "Office 2021 Professional", subtitle: "Licença vitalícia", totalPrice: 449 },
      { title: "Antivírus Kaspersky 1 Ano", subtitle: "Proteção completa", totalPrice: 129 },
    ],
    monitor: [
      { title: "Monitor Gamer 27\" 144Hz", subtitle: "Full HD, 1ms, IPS", totalPrice: 1499 },
      { title: "Monitor 4K 32\"", subtitle: "HDR, 60Hz, USB-C", totalPrice: 2499 },
      { title: "Monitor Curvo 34\" Ultrawide", subtitle: "QHD, 100Hz", totalPrice: 2999 },
    ],
    cadeira_gamer: [
      { title: "Cadeira Gamer Premium", subtitle: "Reclinável 180°, apoio lombar", totalPrice: 1299 },
      { title: "Cadeira Gamer RGB", subtitle: "LED integrado, braços 4D", totalPrice: 1799 },
      { title: "Cadeira Escritório Ergonômica", subtitle: "Tela mesh, encosto cabeça", totalPrice: 899 },
    ],
  };

  // Add test hardware data for specific category
  async function addTestHardwareData(category: HardwareCategory) {
    const categoryData = testHardwareData[category];
    if (!categoryData || categoryData.length === 0) {
      toast({ title: "Erro", description: "Nenhum dado de teste disponível para esta categoria", variant: "destructive" });
      return;
    }

    let successCount = 0;
    for (const item of categoryData) {
      const success = await api.createHardware({
        name: item.name,
        brand: item.brand,
        model: item.model,
        price: item.price,
        specs: item.specs,
        image: item.image || "",
        category: category,
        socket: item.socket,
        memoryType: item.memoryType,
      });
      if (success) successCount++;
    }

    const categoryLabel = hardwareCategories.find(c => c.key === category)?.label || category;
    toast({
      title: "Dados de teste adicionados",
      description: `${successCount} ${categoryLabel} criados com sucesso com imagens!`,
    });
    fetchHardwareData();
  }

  // Add test product data for specific category
  async function addTestProductData(category: ProductCategory) {
    const categoryData = testProductData[category];
    const categoryImages = testProductImages[category];
    
    if (!categoryData || categoryData.length === 0) {
      toast({ title: "Erro", description: "Nenhum dado de teste disponível para esta categoria", variant: "destructive" });
      return;
    }

    let successCount = 0;
    for (let i = 0; i < categoryData.length; i++) {
      const product = categoryData[i];
      const imageUrl = categoryImages ? categoryImages[i % categoryImages.length] : undefined;
      
      const media: MediaItem[] = imageUrl ? [{ type: 'image', url: imageUrl }] : [];
      
      const success = await api.createProduct({
        title: product.title,
        subtitle: product.subtitle,
        totalPrice: product.totalPrice,
        productType: category,
        downloadUrl: product.downloadUrl || "",
        categories: [category],
        media: media,
        specs: {},
        components: {},
      });
      if (success) successCount++;
    }

    const categoryLabel = productTypes.find(t => t.key === category)?.label || category;
    toast({
      title: "Dados de teste adicionados",
      description: `${successCount} ${categoryLabel}(s) criados com sucesso!`,
    });
    fetchProductsData();
  }

  // Bulk upload products
  function downloadProductExcelTemplate() {
    const templateData = [
      {
        titulo: "Produto Exemplo",
        subtitulo: "Descrição curta",
        preco: 999.99,
        tipo: "notebook", // pc, kit, notebook, automacao, software, acessorio
        download_url: "", // apenas para automações
        spec_1_chave: "Processador",
        spec_1_valor: "Intel Core i7",
        spec_2_chave: "RAM",
        spec_2_valor: "16GB",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");

    ws["!cols"] = [
      { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 40 },
      { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 },
    ];

    XLSX.writeFile(wb, `template_produtos.xlsx`);
    toast({ title: "Download iniciado", description: "Use este modelo para envio em massa de produtos" });
  }

  async function handleProductBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
        
        for (let i = 1; i <= 10; i++) {
          const key = row[`spec_${i}_chave`];
          const value = row[`spec_${i}_valor`];
          if (key && value) {
            specs[key] = String(value);
          }
        }

        const productType = (row.tipo || "notebook") as ProductCategory;
        const product = {
          title: row.titulo || "",
          subtitle: row.subtitulo || "",
          totalPrice: parseFloat(row.preco) || 0,
          productType,
          downloadUrl: row.download_url || "",
          categories: [productType],
          media: [],
          specs,
          components: {},
        };

        if (product.title) {
          const success = await api.createProduct(product);
          if (success) successCount++;
          else errorCount++;
        } else {
          errorCount++;
        }
      }

      toast({
        title: "Upload concluído",
        description: `${successCount} produtos criados, ${errorCount} erros`,
      });
      fetchProductsData();
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
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
              {activeTab === 'products' && (
                <>
                  <div className="relative group">
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 font-medium text-foreground transition-colors hover:bg-secondary/80"
                    >
                      Adicionar Dados de Teste ▼
                    </button>
                    <div className="absolute right-0 top-full z-50 hidden w-48 rounded-lg bg-card border border-border shadow-lg group-hover:block">
                      {productTypes.filter(t => !['pc', 'kit'].includes(t.key)).map(type => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.key}
                            onClick={() => addTestProductData(type.key)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground hover:bg-secondary/50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <Icon className="h-4 w-4" />
                            {type.label}s
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => openProductEditor()}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-5 w-5" />
                    Novo Produto
                  </button>
                </>
              )}
              {activeTab === 'hardware' && (
                <>
                  <button
                    onClick={() => addTestHardwareData(activeHardwareCategory)}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 font-medium text-foreground transition-colors hover:bg-secondary/80"
                  >
                    Adicionar {hardwareCategories.find(c => c.key === activeHardwareCategory)?.label || 'Dados'} de Teste
                  </button>
                  <button
                    onClick={() => openHardwareEditor()}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-5 w-5" />
                    Novo Componente
                  </button>
                </>
              )}
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
              Produtos
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
              Hardware (PC)
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
                activeTab === 'company'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors ${
                activeTab === 'categories'
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              <Tag className="h-5 w-5" />
              Categorias
            </button>
          </div>

          {/* Products Tab */}
          {activeTab === 'products' && (
            <>
              {/* Bulk actions for products */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={downloadProductExcelTemplate}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template Excel
                </button>
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                  <Upload className="h-4 w-4" />
                  Importar Produtos (Excel)
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleProductBulkUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Mídia</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Título</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tipo</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Preço</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {products.map((product) => {
                        const typeInfo = productTypes.find(t => t.key === product.productType) || productTypes[0];
                        const TypeIcon = typeInfo.icon;
                        return (
                          <tr key={product.id} className="hover:bg-secondary/50">
                            <td className="px-6 py-4">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                                {product.media?.[0]?.type === 'video' ? (
                                  <Play className="h-6 w-6 text-muted-foreground" />
                                ) : product.media?.[0]?.url ? (
                                  <img
                                    src={product.media[0].url}
                                    alt={product.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <TypeIcon className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-foreground">{product.title}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <TypeIcon className="h-4 w-4" />
                                {typeInfo.label}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-primary">
                              {product.productType === 'automacao' ? 'Download' : formatPrice(product.totalPrice)}
                            </td>
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
                        );
                      })}
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

          {/* Company Tab */}
          {activeTab === 'company' && (
            <div className="max-w-2xl">
              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-xl font-bold text-foreground mb-6">Dados da Empresa</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Estes dados serão exibidos nos orçamentos gerados pelos clientes.
                  </p>

                  <div className="space-y-4">
                    {/* Logo */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Logo da Empresa</label>
                      <div className="flex items-center gap-4">
                        {companyData.logo ? (
                          <img
                            src={companyData.logo}
                            alt="Logo"
                            className="h-20 w-20 object-contain rounded-lg border border-border bg-background"
                          />
                        ) : (
                          <div className="h-20 w-20 rounded-lg border border-dashed border-border bg-secondary flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                          <Upload className="h-4 w-4" />
                          Enviar Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCompanyLogoUpload}
                            className="hidden"
                          />
                        </label>
                        {companyData.logo && (
                          <button
                            onClick={() => setCompanyData(prev => ({ ...prev, logo: '' }))}
                            className="text-sm text-destructive hover:underline"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Nome da Empresa</label>
                      <input
                        type="text"
                        value={companyData.name}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Nome da sua empresa"
                      />
                    </div>

                    {/* CNPJ */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">CNPJ</label>
                      <input
                        type="text"
                        value={companyData.cnpj}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, cnpj: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Endereço</label>
                      <input
                        type="text"
                        value={companyData.address}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Rua, número, bairro"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Cidade/Estado</label>
                      <input
                        type="text"
                        value={companyData.city}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="São Paulo - SP"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                      <input
                        type="text"
                        value={companyData.phone}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="(11) 99999-9999"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
                      <input
                        type="email"
                        value={companyData.email}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="contato@empresa.com"
                      />
                    </div>

                    {/* Seller */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Vendedor</label>
                      <input
                        type="text"
                        value={companyData.seller}
                        onChange={(e) => setCompanyData(prev => ({ ...prev, seller: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Nome do vendedor padrão"
                      />
                    </div>

                    <button
                      onClick={handleCompanySave}
                      disabled={savingCompany}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                      {savingCompany ? "Salvando..." : "Salvar Dados"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="max-w-2xl">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Gerenciar Categorias</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Visualize e gerencie as categorias dos seus produtos. Novas categorias podem ser criadas no cadastro de produtos.
                </p>

                {/* Default categories */}
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-3">Categorias Padrão</h3>
                  <div className="flex flex-wrap gap-2">
                    {baseProductTypes.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <div
                          key={cat.key}
                          className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                        >
                          <Icon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Custom categories */}
                {customCategoriesList.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">Categorias Personalizadas</h3>
                    <div className="space-y-2">
                      {customCategoriesList.map((cat) => (
                        <div
                          key={cat.key}
                          className="flex items-center justify-between rounded-lg bg-secondary/50 border border-border px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <Tag className="h-4 w-4 text-primary" />
                            <span className="font-medium text-foreground">{cat.label}</span>
                            <span className="text-sm text-muted-foreground">({cat.key})</span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm(`Remover categoria "${cat.label}"?`)) {
                                removeCustomCategory(cat.key);
                                setCustomCategoriesList(getCustomCategories());
                                toast({ title: "Categoria removida" });
                              }
                            }}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hardware Tab */}
          {activeTab === 'hardware' && (
            <>
              {/* Hardware Category Tabs */}
              <div className="mb-6 flex flex-wrap gap-2">
                {hardwareCategories.map((cat) => {
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

              {/* Bulk actions */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={downloadExcelTemplate}
                  className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template Excel
                </button>
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                  <Upload className="h-4 w-4" />
                  Importar Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
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
                {editingProductId ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button onClick={closeProductEditor} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-8">
              {/* Product Type Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Tipo de Produto *</label>
                <div className="flex flex-wrap gap-2">
                  {productTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => setProductFormData(prev => ({ ...prev, productType: type.key }))}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          productFormData.productType === type.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </button>
                    );
                  })}
                  {/* Add new type button */}
                  <button
                    type="button"
                    onClick={() => setShowNewTypeModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Tipo
                  </button>
                </div>
              </div>

              {/* New Type Modal */}
              {showNewTypeModal && (
                <div className="rounded-xl border border-primary bg-primary/5 p-4">
                  <h4 className="mb-4 font-semibold text-foreground">Criar Novo Tipo de Produto</h4>
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <input
                      type="text"
                      value={inlineNewCategoryKey}
                      onChange={(e) => setInlineNewCategoryKey(e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))}
                      className="rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                      placeholder="chave (ex: periferico)"
                    />
                    <input
                      type="text"
                      value={inlineNewCategoryLabel}
                      onChange={(e) => setInlineNewCategoryLabel(e.target.value)}
                      className="rounded-lg border border-border bg-background px-4 py-2 text-foreground"
                      placeholder="Nome (ex: Periférico)"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-foreground">Escolha um ícone:</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {availableIcons.map((iconItem) => {
                        const IconComp = iconItem.icon;
                        return (
                          <button
                            key={iconItem.key}
                            type="button"
                            onClick={() => setInlineNewCategoryIcon(iconItem.key)}
                            className={`p-2 rounded-lg transition-colors ${
                              inlineNewCategoryIcon === iconItem.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                          >
                            <IconComp className="h-5 w-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (inlineNewCategoryKey && inlineNewCategoryLabel) {
                          addCustomCategory(inlineNewCategoryKey, inlineNewCategoryLabel, inlineNewCategoryIcon);
                          setCustomCategoriesList(getCustomCategories());
                          setProductFormData(prev => ({ ...prev, productType: inlineNewCategoryKey as ProductCategory }));
                          setInlineNewCategoryKey("");
                          setInlineNewCategoryLabel("");
                          setInlineNewCategoryIcon("tag");
                          setShowNewTypeModal(false);
                          toast({ title: "Tipo criado!", description: `${inlineNewCategoryLabel} adicionado` });
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Tipo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewTypeModal(false)}
                      className="rounded-lg border border-border px-4 py-2 text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Título *</label>
                  <input
                    type="text"
                    value={productFormData.title}
                    onChange={(e) => setProductFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Nome do produto"
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

              {/* Price for products without component selection (not PC or Kit) */}
              {!['pc', 'kit'].includes(productFormData.productType) && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Preço (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={productFormData.totalPrice}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, totalPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Download URL for automações */}
                  {productFormData.productType === 'automacao' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Link de Download *</label>
                      <input
                        type="url"
                        value={productFormData.downloadUrl}
                        onChange={(e) => setProductFormData(prev => ({ ...prev, downloadUrl: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="https://exemplo.com/download"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Media Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Mídia (Fotos e Vídeos)</label>
                <div className="mb-4 flex flex-wrap gap-4">
                  {productFormData.media.map((item, i) => (
                    <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg bg-secondary">
                      {item.type === 'video' ? (
                        item.url.includes('youtube.com/embed') ? (
                          <div className="h-full w-full flex items-center justify-center bg-red-600">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        ) : (
                          <video src={item.url} className="h-full w-full object-cover" muted />
                        )
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
                    <span className="mt-1 text-xs">Upload</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {/* YouTube Video URL Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Cole o link do YouTube aqui..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addVideoByUrl())}
                  />
                  <button
                    type="button"
                    onClick={addVideoByUrl}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                  >
                    <Play className="h-4 w-4" />
                    Adicionar Vídeo
                  </button>
                </div>
              </div>

              {/* Component Selection - For PC and Kit types */}
              {(productFormData.productType === 'pc' || productFormData.productType === 'kit') && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">
                    {productFormData.productType === 'kit' ? 'Componentes do Kit' : 'Componentes Obrigatórios'}
                  </h3>
                  
                  {/* Progress indicators */}
                  <div className="flex flex-wrap gap-2">
                    {(productFormData.productType === 'kit' ? kitComponentSteps : componentSteps).map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = !!productFormData.components[step.key as keyof ProductComponents];
                      const steps = productFormData.productType === 'kit' ? kitComponentSteps : componentSteps;
                      const currentStepIndex = steps.findIndex(
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
                    const steps = productFormData.productType === 'kit' ? kitComponentSteps : componentSteps;
                    const currentStepIndex = steps.findIndex(
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
                            {steps.map(step => {
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
                    
                    const currentStep = steps[currentStepIndex];
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
                            Passo {currentStepIndex + 1} de {steps.length}
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
                              {steps.slice(0, currentStepIndex).map(step => {
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
              )}

              {/* Total Price */}
              <div className="rounded-xl bg-primary/10 p-6 text-center">
                <p className="text-sm text-muted-foreground">Preço Total</p>
                <p className="text-4xl font-bold text-primary">{formatPrice(productFormData.totalPrice)}</p>
              </div>

              {/* Categories as Tags */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Categorias (clique para selecionar onde o produto aparece)</label>
                <div className="flex flex-wrap gap-2">
                  {productTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = productFormData.categories.includes(type.key);
                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => {
                          setProductFormData(prev => ({
                            ...prev,
                            categories: isSelected
                              ? prev.categories.filter(c => c !== type.key)
                              : [...prev.categories, type.key]
                          }));
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-glow"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {type.label}
                        {isSelected && <span className="ml-1">✓</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Selecione em quais categorias este produto deve aparecer na loja
                </p>
              </div>

              {/* Specs */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Especificações</label>
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
                  Salvar Produto
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
                {editingHardwareId ? "Editar Componente" : "Novo Componente"}
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

              {/* Hardware Image Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Imagem do Produto</label>
                <div className="flex items-center gap-4">
                  {hardwareFormData.image ? (
                    <img
                      src={hardwareFormData.image}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border bg-secondary flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                      <Upload className="h-4 w-4" />
                      Enviar Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHardwareImageUpload}
                        className="hidden"
                      />
                    </label>
                    {hardwareFormData.image && (
                      <button
                        type="button"
                        onClick={() => setHardwareFormData(prev => ({ ...prev, image: '' }))}
                        className="text-sm text-destructive hover:underline"
                      >
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {(hardwareFormData.category === 'processor' || hardwareFormData.category === 'motherboard' || hardwareFormData.category === 'cooler') && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-primary">Campos de Compatibilidade</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-foreground">Socket *</label>
                      <select
                        value={hardwareFormData.socket || ""}
                        onChange={(e) => setHardwareFormData(prev => ({ ...prev, socket: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="">Selecione o socket</option>
                        {socketOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    {hardwareFormData.category === 'processor' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-foreground">TDP (Watts)</label>
                        <input
                          type="number"
                          value={hardwareFormData.tdp || ""}
                          onChange={(e) => setHardwareFormData(prev => ({ ...prev, tdp: parseInt(e.target.value) || 0 }))}
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                          placeholder="Ex: 125"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hardwareFormData.category === 'motherboard' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Tipo de Memória *</label>
                    <select
                      value={hardwareFormData.memoryType || ""}
                      onChange={(e) => setHardwareFormData(prev => ({ ...prev, memoryType: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {memoryTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Form Factor *</label>
                    <select
                      value={hardwareFormData.formFactor || ""}
                      onChange={(e) => setHardwareFormData(prev => ({ ...prev, formFactor: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {formFactorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {hardwareFormData.category === 'memory' && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-primary">Campos de Compatibilidade</h3>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Tipo de Memória *</label>
                    <select
                      value={hardwareFormData.memoryType || ""}
                      onChange={(e) => setHardwareFormData(prev => ({ ...prev, memoryType: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {memoryTypeOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {hardwareFormData.category === 'case' && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-primary">Campos de Compatibilidade</h3>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">Form Factors Suportados *</label>
                    <select
                      value={hardwareFormData.formFactor || ""}
                      onChange={(e) => setHardwareFormData(prev => ({ ...prev, formFactor: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Selecione</option>
                      {formFactorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">Gabinetes maiores suportam placas menores (ATX suporta Micro-ATX e Mini-ITX)</p>
                  </div>
                </div>
              )}

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
