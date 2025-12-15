import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RedWhiteHeader } from "@/components/RedWhiteHeader";
import { RedWhiteFooter } from "@/components/RedWhiteFooter";
import { api, type Product, type HardwareItem, type MediaItem, type ProductComponents, type CompanyData, type ProductCategory, type HardwareCategory, type HardwareCategoryDef, getCustomCategories, addCustomCategory, removeCustomCategory, updateCustomCategory, getHardwareCategories, addHardwareCategory, removeHardwareCategory, updateHardwareCategory, getCategories, updateCategory, type Category } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { useAdminAuth, checkAdminAuth } from "@/hooks/useAdminAuth";
import { AdminLoginModal } from "@/components/AdminLoginModal";
import { Plus, Pencil, Trash2, Save, X, Upload, Play, Image, Cpu, CircuitBoard, MemoryStick, HardDrive, Monitor, Zap, Box, Package, Download, Droplets, Building2, Laptop, Bot, Code, Wrench, Key, Tv, Armchair, Tag, LucideIcon, Search, Sparkles, LayoutDashboard, Images, Users, UserPlus, Shield, Mail, Settings, Eye, EyeOff, Volume2, GripVertical, Palette, LogOut } from "lucide-react";
import * as XLSX from "xlsx";
import { availableIcons, getIconFromKey } from "@/lib/icons";
import { HardwareCard } from "@/components/HardwareCard";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { AdminDashboard } from "@/components/AdminDashboard";
import { CarouselManager } from "@/components/CarouselManager";
import { AICategoryClassifier } from "@/components/AICategoryClassifier";
import { CompanySettingsForm } from "@/components/admin/CompanySettingsForm";
import { GlobalSettingsForm } from "@/components/admin/GlobalSettingsForm";
import { ColorPaletteSelector, type ColorPalette } from "@/components/admin/ColorPaletteSelector";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Category Button Component
interface SortableCategoryButtonProps {
  category: { key: string; label: string; icon?: string };
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onDelete: () => void;
}

function SortableCategoryButton({ category, isSelected, onClick, onDoubleClick, onDelete }: SortableCategoryButtonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isSelected ? '#DC2626' : '#f3f4f6',
    color: isSelected ? 'white' : '#374151',
  };

  const Icon = getIconFromKey(category.icon || 'tag');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        isDragging ? 'ring-2 ring-primary z-50' : ''
      }`}
      {...attributes}
    >
      <button
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-black/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className="inline-flex items-center gap-1.5"
      >
        <Icon className="h-3.5 w-3.5" />
        {category.label}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded text-current hover:text-red-500 transition-all"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// Admin API URL
const ADMIN_API_URL = 'https://www.n8nbalao.com/api/admins.php';

type AdminTab = 'dashboard' | 'products' | 'simple_products' | 'hardware' | 'categories' | 'company' | 'carousels' | 'admins' | 'settings';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  role: string;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

interface ExtraProduct {
  id: string;
  title: string;
  price: number;
  category: string;
}

interface ProductFormData {
  title: string;
  subtitle: string;
  description: string;
  categories: string[];
  media: MediaItem[];
  specs: Record<string, string>;
  components: ProductComponents;
  extraProducts: ExtraProduct[];
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
  { value: 'LGA1151', label: 'Intel LGA 1151 (6ª-9ª Gen)' },
  { value: 'LGA1150', label: 'Intel LGA 1150 (4ª-5ª Gen)' },
  { value: 'LGA1155', label: 'Intel LGA 1155 (2ª-3ª Gen)' },
  { value: 'AM5', label: 'AMD AM5 (Ryzen 7000+)' },
  { value: 'AM4', label: 'AMD AM4 (Ryzen 1000-5000)' },
  { value: 'AM3+', label: 'AMD AM3+ (FX Series)' },
];

const memoryTypeOptions = [
  { value: 'DDR5', label: 'DDR5' },
  { value: 'DDR4', label: 'DDR4' },
  { value: 'DDR3', label: 'DDR3' },
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
  description: "",
  categories: [],
  media: [],
  specs: {},
  components: {},
  extraProducts: [],
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

// Default hardware categories (will be merged with database ones)
const defaultHardwareCategories: HardwareCategoryDef[] = [
  { key: 'processor', label: 'Processadores', icon: 'cpu', filters: [{ field: 'socket', label: 'Socket', options: ['LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'AM5', 'AM4', 'AM3+'] }] },
  { key: 'motherboard', label: 'Placas-Mãe', icon: 'circuit-board', filters: [{ field: 'socket', label: 'Socket', options: ['LGA1700', 'LGA1200', 'LGA1151', 'LGA1150', 'LGA1155', 'AM5', 'AM4', 'AM3+'] }, { field: 'memoryType', label: 'Memória', options: ['DDR5', 'DDR4', 'DDR3'] }] },
  { key: 'memory', label: 'Memória RAM', icon: 'memory-stick', filters: [{ field: 'memoryType', label: 'Tipo', options: ['DDR5', 'DDR4', 'DDR3'] }] },
  { key: 'storage', label: 'Armazenamento', icon: 'hard-drive', filters: [{ field: 'formFactor', label: 'Tipo', options: ['SSD NVMe', 'SSD SATA', 'HDD'] }] },
  { key: 'gpu', label: 'Placas de Vídeo', icon: 'monitor' },
  { key: 'psu', label: 'Fontes', icon: 'zap', filters: [{ field: 'tdp', label: 'Potência', options: ['500W', '600W', '700W', '800W', '1000W+'] }] },
  { key: 'case', label: 'Gabinetes', icon: 'box', filters: [{ field: 'formFactor', label: 'Tamanho', options: ['ATX', 'Micro-ATX', 'Mini-ITX'] }] },
  { key: 'cooler', label: 'Coolers', icon: 'droplets', filters: [{ field: 'socket', label: 'Socket', options: ['LGA1700', 'LGA1200', 'AM5', 'AM4', 'Universal'] }] },
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
  const { company, refreshCompany } = useCompany();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [loginData, setLoginData] = useState({ user: "", pass: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Admin management state
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [showNewAdminModal, setShowNewAdminModal] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    cpf: '',
    role: 'admin'
  });
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);
  
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
  const [productSortColumn, setProductSortColumn] = useState<'title' | 'type' | 'price'>('title');
  const [productSortDirection, setProductSortDirection] = useState<'asc' | 'desc'>('asc');
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditType, setBulkEditType] = useState<ProductCategory | "">("");
  const [bulkEditCategory, setBulkEditCategory] = useState<string>("");
  const [bulkEditCategoryAction, setBulkEditCategoryAction] = useState<'add' | 'replace' | 'remove'>('add');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Hardware state
  const [activeHardwareCategory, setActiveHardwareCategory] = useState<HardwareCategory>('processor');
  const [hardwareList, setHardwareList] = useState<HardwareItem[]>([]);
  const [isEditingHardware, setIsEditingHardware] = useState(false);
  const [editingHardwareId, setEditingHardwareId] = useState<string | null>(null);
  const [hardwareFormData, setHardwareFormData] = useState<HardwareFormData>(defaultHardwareFormData);
  const [newHardwareSpecKey, setNewHardwareSpecKey] = useState("");
  const [newHardwareSpecValue, setNewHardwareSpecValue] = useState("");
  const [hardwareSearchTerm, setHardwareSearchTerm] = useState("");
  const [hardwareCategoriesList, setHardwareCategoriesList] = useState<HardwareCategoryDef[]>([]);
  const [activeHardwareFilter, setActiveHardwareFilter] = useState<Record<string, string>>({});
  const [selectedHardware, setSelectedHardware] = useState<Set<string>>(new Set());
  const [hardwareSortColumn, setHardwareSortColumn] = useState<'name' | 'brand' | 'price'>('name');
  const [hardwareSortDirection, setHardwareSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Hardware category management modal state
  const [showNewHardwareCategoryModal, setShowNewHardwareCategoryModal] = useState(false);
  const [showEditHardwareCategoryModal, setShowEditHardwareCategoryModal] = useState(false);
  const [editingHardwareCategory, setEditingHardwareCategory] = useState<HardwareCategoryDef | null>(null);
  const [newHardwareCatKey, setNewHardwareCatKey] = useState("");
  const [newHardwareCatLabel, setNewHardwareCatLabel] = useState("");
  const [newHardwareCatIcon, setNewHardwareCatIcon] = useState("box");
  const [newHardwareCatFilters, setNewHardwareCatFilters] = useState<{field: string; label: string; options: string[]}[]>([]);

  // Company state
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    cnpj: '',
    seller: '',
    logo: '',
    primaryColor: '#E31C23',
    secondaryColor: '#FFFFFF',
    accentColor: '#DC2626'
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
  const [extraProductCategory, setExtraProductCategory] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  
  // Edit category modal state
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ key: string; label: string; icon?: string } | null>(null);
  const [editCategoryLabel, setEditCategoryLabel] = useState("");
  const [editCategoryIcon, setEditCategoryIcon] = useState("tag");
  
  // AI Classifier state
  const [showAIClassifier, setShowAIClassifier] = useState(false);
  const [categoriesForSort, setCategoriesForSort] = useState<Category[]>([]);
  
  // Settings state
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  
  // AI Models settings
  const [lorenzoName, setLorenzoName] = useState("Lorenzo");
  const [lorenzoModel, setLorenzoModel] = useState("gpt-4o-mini");
  const [bulkGenModel, setBulkGenModel] = useState("gpt-4o-mini");
  const [singleGenModel, setSingleGenModel] = useState("gpt-4o-mini");
  
  // ElevenLabs Voice settings
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState("");
  const [elevenlabsVoiceId, setElevenlabsVoiceId] = useState("");
  const [elevenlabsEnabled, setElevenlabsEnabled] = useState(false);
  const [showElevenlabsKey, setShowElevenlabsKey] = useState(false);
  
  // Available ElevenLabs voices
  const availableVoices = [
    { value: 'B93iDjT4HFRCZ3Ju8oaV', label: 'Voz Personalizada (Padrão)' },
    { value: '9BWtsMINqrJLrRacOk9x', label: 'Aria' },
    { value: 'CwhRBWXzGAHq8TQ4Fs17', label: 'Roger' },
    { value: 'EXAVITQu4vr4xnSDxMaL', label: 'Sarah' },
    { value: 'FGY2WhTYpPnrIDTdsKH5', label: 'Laura' },
    { value: 'IKne3meq5aSn9XLyUdCD', label: 'Charlie' },
    { value: 'JBFqnCBsd6RMkjVDRZzb', label: 'George' },
    { value: 'onwK4e9ZLuTAKqWW03F9', label: 'Daniel' },
    { value: 'pFZP5JQG7iQjIQuC4Bku', label: 'Lily' },
  ];
  
  // Available OpenAI models
  const availableModels = [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Rápido e barato)', inputCost: 0.15, outputCost: 0.60 },
    { value: 'gpt-4o', label: 'GPT-4o (Mais inteligente)', inputCost: 2.50, outputCost: 10.00 },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', inputCost: 10.00, outputCost: 30.00 },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Mais barato)', inputCost: 0.50, outputCost: 1.50 },
  ];

  // DnD sensors for category reordering
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle category drag end
  const handleCategoryDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = customCategoriesList.findIndex((item) => item.key === active.id);
      const newIndex = customCategoriesList.findIndex((item) => item.key === over.id);

      const newItems = arrayMove(customCategoriesList, oldIndex, newIndex);
      setCustomCategoriesList(newItems);

      // Update sort order in database
      for (let i = 0; i < newItems.length; i++) {
        await updateCategory(newItems[i].key, { sortOrder: i });
      }

      toast({ title: 'Ordem atualizada', description: 'A ordem das categorias foi salva.' });
    }
  };

  // Admin login function - uses same credentials as customer auth
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Check for default admin credentials
      if ((loginData.user === 'admin@n8nbalao' || loginData.user === 'n8nbalao') && loginData.pass === 'Balao2025') {
        const adminUser: AdminUser = {
          id: '1',
          name: 'Administrador',
          email: 'admin@n8nbalao',
          role: 'super_admin',
          active: true,
          createdAt: new Date().toISOString()
        };
        setCurrentAdmin(adminUser);
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_data", JSON.stringify(adminUser));
        toast({ title: "Bem-vindo!", description: `Olá, Administrador` });
        return;
      }
      
      // Try API login for other admins
      const response = await fetch(ADMIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginData.user,
          username: loginData.user,
          password: loginData.pass
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.admin) {
        setCurrentAdmin(data.admin);
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_data", JSON.stringify(data.admin));
        toast({ title: "Bem-vindo!", description: `Olá, ${data.admin.name}` });
      } else {
        toast({ title: "Erro", description: data.error || "Credenciais inválidas", variant: "destructive" });
      }
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to default credentials
      if ((loginData.user === 'admin@n8nbalao' || loginData.user === 'n8nbalao') && loginData.pass === 'Balao2025') {
        const adminUser: AdminUser = {
          id: '1',
          name: 'Administrador',
          email: 'admin@n8nbalao',
          role: 'super_admin',
          active: true,
          createdAt: new Date().toISOString()
        };
        setCurrentAdmin(adminUser);
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_data", JSON.stringify(adminUser));
        toast({ title: "Bem-vindo!", description: `Olá, Administrador` });
      } else {
        toast({ title: "Erro", description: "Credenciais inválidas", variant: "destructive" });
      }
    } finally {
      setIsLoggingIn(false);
    }
  }

  // Google login - uses same endpoint as customer login
  async function handleGoogleLogin() {
    try {
      const response = await fetch('https://www.n8nbalao.com/api/google-auth.php?action=get_auth_url&type=admin');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({ title: "Erro", description: "Falha ao conectar com Google", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha na conexão", variant: "destructive" });
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setCurrentAdmin(null);
    sessionStorage.removeItem("admin_auth");
    sessionStorage.removeItem("admin_data");
  }

  // Fetch admins list
  async function fetchAdmins() {
    try {
      const response = await fetch(`${ADMIN_API_URL}?action=list`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAdminsList(data);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  }

  // Create new admin
  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newAdminData.name || !newAdminData.email) {
      toast({ title: "Erro", description: "Nome e email são obrigatórios", variant: "destructive" });
      return;
    }
    
    setIsSavingAdmin(true);
    
    try {
      const response = await fetch(ADMIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          ...newAdminData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Sucesso", description: "Administrador cadastrado!" });
        setShowNewAdminModal(false);
        setNewAdminData({ name: '', email: '', password: '', phone: '', cpf: '', role: 'admin' });
        fetchAdmins();
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao cadastrar", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha na conexão", variant: "destructive" });
    } finally {
      setIsSavingAdmin(false);
    }
  }

  // Toggle admin active status
  async function toggleAdminActive(admin: AdminUser) {
    try {
      const response = await fetch(ADMIN_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: admin.id,
          active: !admin.active
        })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchAdmins();
        toast({ title: "Sucesso", description: admin.active ? "Administrador desativado" : "Administrador ativado" });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao atualizar", variant: "destructive" });
    }
  }

  // All categories come from database now
  const productTypes = customCategoriesList.map(c => ({ 
    key: c.key as ProductCategory, 
    label: c.label, 
    icon: getIconFromKey(c.icon || 'tag') 
  }));

  // Load custom categories and hardware categories on mount
  useEffect(() => {
    async function loadCategories() {
      const [categories, hwCategories] = await Promise.all([
        getCustomCategories(),
        getHardwareCategories()
      ]);
      setCustomCategoriesList(categories);
      // Merge database categories with defaults (database takes precedence)
      const mergedHwCategories = [...defaultHardwareCategories];
      hwCategories.forEach(dbCat => {
        const idx = mergedHwCategories.findIndex(c => c.key === dbCat.key);
        if (idx >= 0) {
          mergedHwCategories[idx] = dbCat;
        } else {
          mergedHwCategories.push(dbCat);
        }
      });
      setHardwareCategoriesList(mergedHwCategories);
    }
    loadCategories();
  }, []);

  // Check for saved session or Google auth callback
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_auth");
    const savedData = sessionStorage.getItem("admin_data");
    
    // Handle Google auth callback
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get('google_auth');
    const authData = urlParams.get('data');
    const authError = urlParams.get('error');
    
    if (authError) {
      if (authError === 'not_admin') {
        const email = urlParams.get('email');
        toast({ 
          title: "Acesso negado", 
          description: `${email || 'Este email'} não está cadastrado como administrador. Redirecionando...`, 
          variant: "destructive" 
        });
        // Redirect to home after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else if (authError === 'account_disabled') {
        toast({ title: "Conta desativada", description: "Sua conta de administrador foi desativada.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: `Falha no login: ${authError}`, variant: "destructive" });
      }
      // Clean URL
      window.history.replaceState({}, '', '/admin');
    } else if (googleAuth === 'success' && authData) {
      try {
        const adminData = JSON.parse(atob(decodeURIComponent(authData)));
        const adminUser: AdminUser = {
          id: adminData.id,
          name: adminData.name,
          email: adminData.email,
          role: adminData.role || 'admin',
          avatar: adminData.avatar,
          active: true,
          createdAt: new Date().toISOString()
        };
        setCurrentAdmin(adminUser);
        setIsAuthenticated(true);
        sessionStorage.setItem("admin_auth", "true");
        sessionStorage.setItem("admin_data", JSON.stringify(adminUser));
        toast({ title: "Bem-vindo!", description: `Olá, ${adminData.name}` });
        // Clean URL
        window.history.replaceState({}, '', '/admin');
      } catch (e) {
        console.error('Error parsing admin data:', e);
      }
    } else if (saved === "true" && savedData) {
      try {
        const adminData = JSON.parse(savedData);
        setCurrentAdmin(adminData);
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(true);
      }
    } else if (saved === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'products' || activeTab === 'simple_products') {
        fetchProductsData();
      } else if (activeTab === 'hardware') {
        fetchHardwareData();
      } else if (activeTab === 'company') {
        fetchCompanyData();
      } else if (activeTab === 'admins') {
        fetchAdmins();
      } else if (activeTab === 'settings') {
        fetchSettings();
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

  async function fetchSettings() {
    setLoadingSettings(true);
    try {
      const response = await fetch('https://www.n8nbalao.com/api/settings.php');
      const text = await response.text();
      
      // Handle empty response
      if (!text || text.trim() === '') {
        console.log('Settings API returned empty response - using defaults');
        setLoadingSettings(false);
        return;
      }
      
      const data = JSON.parse(text);
      if (data.success && Array.isArray(data.data)) {
        data.data.forEach((setting: { key: string; value: string }) => {
          if (setting.key === 'openai_api_key') setOpenaiApiKey(setting.value || '');
          if (setting.key === 'lorenzo_name') setLorenzoName(setting.value || 'Lorenzo');
          if (setting.key === 'lorenzo_model') setLorenzoModel(setting.value || 'gpt-4o-mini');
          if (setting.key === 'bulk_gen_model') setBulkGenModel(setting.value || 'gpt-4o-mini');
          if (setting.key === 'single_gen_model') setSingleGenModel(setting.value || 'gpt-4o-mini');
          if (setting.key === 'elevenlabs_api_key') setElevenlabsApiKey(setting.value || '');
          if (setting.key === 'elevenlabs_voice_id') setElevenlabsVoiceId(setting.value || 'B93iDjT4HFRCZ3Ju8oaV');
          if (setting.key === 'elevenlabs_enabled') setElevenlabsEnabled(setting.value === 'true');
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
    setLoadingSettings(false);
  }

  async function saveSettings() {
    setSavingSettings(true);
    try {
      const settings = [
        { key: 'openai_api_key', value: openaiApiKey },
        { key: 'lorenzo_name', value: lorenzoName },
        { key: 'lorenzo_model', value: lorenzoModel },
        { key: 'bulk_gen_model', value: bulkGenModel },
        { key: 'single_gen_model', value: singleGenModel },
        { key: 'elevenlabs_api_key', value: elevenlabsApiKey },
        { key: 'elevenlabs_voice_id', value: elevenlabsVoiceId },
        { key: 'elevenlabs_enabled', value: elevenlabsEnabled ? 'true' : 'false' },
      ];
      
      let allSuccess = true;
      for (const setting of settings) {
        const response = await fetch('https://www.n8nbalao.com/api/settings.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting)
        });
        const text = await response.text();
        console.log(`Saved ${setting.key}:`, text);
        
        if (text) {
          try {
            const result = JSON.parse(text);
            if (!result.success) allSuccess = false;
          } catch {
            allSuccess = false;
          }
        }
      }
      
      if (allSuccess) {
        toast({ title: "Sucesso", description: "Configurações salvas!" });
      } else {
        toast({ title: "Aviso", description: "Algumas configurações podem não ter sido salvas. Verifique se o arquivo settings.php foi enviado ao servidor.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: "Erro", description: "Falha ao salvar configurações. Verifique se o arquivo settings.php está no servidor.", variant: "destructive" });
    }
    setSavingSettings(false);
  }

  // company and refreshCompany already declared at top of component

  async function handleCompanySave() {
    setSavingCompany(true);
    const success = await api.saveCompany(companyData);
    if (success) {
      toast({ title: "Sucesso", description: "Dados da empresa salvos!" });
      // Refresh company context to apply new colors globally
      await refreshCompany();
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

  async function generateProductInfoWithAI() {
    if (!productFormData.title) {
      toast({ title: "Erro", description: "Digite o nome do produto primeiro", variant: "destructive" });
      return;
    }
    
    const apiKey = localStorage.getItem('openai_api_key');
    if (!apiKey) {
      toast({ 
        title: "API Key necessária", 
        description: "Configure sua chave OpenAI na página de Extração IA primeiro", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsGeneratingAI(true);
    
    try {
      const response = await fetch('https://n8nbalao.com/api/generate.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productFormData.title,
          productType: productFormData.productType,
          apiKey
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar informações');
      }
      
      const { data } = result;
      
      setProductFormData(prev => ({
        ...prev,
        subtitle: data.subtitle || prev.subtitle,
        description: data.description || prev.description,
        specs: data.specs || prev.specs,
      }));
      
      toast({ title: "Sucesso!", description: "Informações geradas com IA" });
    } catch (error) {
      console.error('AI generation error:', error);
      toast({ 
        title: "Erro", 
        description: error instanceof Error ? error.message : "Erro ao gerar informações", 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingAI(false);
    }
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

  async function openProductEditor(product?: Product) {
    // Refresh custom categories before opening editor
    const categories = await getCustomCategories();
    setCustomCategoriesList(categories);
    
    if (product) {
      setEditingProductId(product.id);
      setProductFormData({
        title: product.title,
        subtitle: product.subtitle || "",
        description: product.description || "",
        categories: product.categories || [],
        media: product.media || [],
        specs: product.specs || {},
        components: product.components || {},
        extraProducts: (product as any).extraProducts || [],
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

  async function handleBulkDeleteProducts() {
    if (selectedProducts.size === 0) return;
    
    if (confirm(`Tem certeza que deseja excluir ${selectedProducts.size} produto(s)?`)) {
      let successCount = 0;
      for (const id of selectedProducts) {
        const success = await api.deleteProduct(id);
        if (success) successCount++;
      }
      
      toast({ 
        title: "Sucesso", 
        description: `${successCount} produto(s) excluído(s)!` 
      });
      setSelectedProducts(new Set());
      fetchProductsData();
    }
  }

  async function handleBulkEditProducts() {
    if (selectedProducts.size === 0) return;
    
    if (!bulkEditType && !bulkEditCategory) {
      toast({ title: "Erro", description: "Selecione o tipo ou categoria para aplicar", variant: "destructive" });
      return;
    }
    
    let successCount = 0;
    for (const id of selectedProducts) {
      const product = products.find(p => p.id === id);
      if (!product) continue;
      
      const updateData: any = {};
      
      // Apply type change if selected
      if (bulkEditType) {
        updateData.productType = bulkEditType;
      }
      
      // Apply category change based on action
      if (bulkEditCategory) {
        const existingCategories = product.categories || [];
        
        if (bulkEditCategoryAction === 'add') {
          // Add category if not already present
          if (!existingCategories.includes(bulkEditCategory)) {
            updateData.categories = [...existingCategories, bulkEditCategory];
          }
        } else if (bulkEditCategoryAction === 'replace') {
          // Replace all categories with selected one
          updateData.categories = [bulkEditCategory];
        } else if (bulkEditCategoryAction === 'remove') {
          // Remove specific category
          updateData.categories = existingCategories.filter(c => c !== bulkEditCategory);
        }
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        const success = await api.updateProduct(id, updateData);
        if (success) successCount++;
      }
    }
    
    toast({ 
      title: "Sucesso", 
      description: `${successCount} produto(s) atualizado(s)!` 
    });
    setSelectedProducts(new Set());
    setShowBulkEditModal(false);
    setBulkEditType("");
    setBulkEditCategory("");
    setBulkEditCategoryAction('add');
    fetchProductsData();
  }

  function toggleProductSelection(id: string) {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  // Get filtered products based on search term and category filter
  const getFilteredProducts = () => {
    let filtered = products;
    
    // Filter by category if selected
    if (selectedCategoryFilter) {
      filtered = filtered.filter(p => p.productType === selectedCategoryFilter);
    }
    
    // Filter by search term
    if (productSearchTerm) {
      const search = productSearchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(search) ||
        (p.subtitle || '').toLowerCase().includes(search) ||
        (p.productType || '').toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };

  function toggleAllProducts() {
    const filtered = getFilteredProducts();
    const allFilteredSelected = filtered.length > 0 && filtered.every(p => selectedProducts.has(p.id));
    
    if (allFilteredSelected) {
      // Deselect only the filtered products
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        filtered.forEach(p => newSet.delete(p.id));
        return newSet;
      });
    } else {
      // Select all filtered products (add to existing selection)
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        filtered.forEach(p => newSet.add(p.id));
        return newSet;
      });
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

  // Hardware bulk selection functions
  function toggleHardwareSelection(id: string) {
    setSelectedHardware(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function toggleAllHardware() {
    if (selectedHardware.size === hardwareList.length) {
      setSelectedHardware(new Set());
    } else {
      setSelectedHardware(new Set(hardwareList.map(h => h.id)));
    }
  }

  async function handleBulkDeleteHardware() {
    if (!confirm(`Tem certeza que deseja excluir ${selectedHardware.size} item(ns)?`)) return;
    
    let successCount = 0;
    for (const id of selectedHardware) {
      const success = await api.deleteHardware(id);
      if (success) successCount++;
    }
    
    if (successCount > 0) {
      toast({ 
        title: "Sucesso", 
        description: `${successCount} item(ns) excluído(s)!` 
      });
      setSelectedHardware(new Set());
      fetchHardwareData();
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Bulk upload/export functions - exports ALL existing hardware as backup
  function downloadExcelTemplate() {
    // Get all hardware for current category
    const categoryHardware = hardwareList;
    
    // Find max number of specs across all items
    let maxSpecs = 5;
    categoryHardware.forEach(item => {
      const specCount = Object.keys(item.specs || {}).length;
      if (specCount > maxSpecs) maxSpecs = specCount;
    });

    // Build export data from existing hardware
    const exportData = categoryHardware.map(item => {
      const row: Record<string, any> = {
        nome: item.name,
        marca: item.brand,
        modelo: item.model,
        preco: item.price,
        categoria: item.category,
        socket: item.socket || "",
        memoria_tipo: item.memoryType || "",
        form_factor: item.formFactor || "",
        tdp: item.tdp || "",
      };

      // Add specs dynamically
      const specEntries = Object.entries(item.specs || {});
      for (let i = 0; i < maxSpecs; i++) {
        row[`spec_${i + 1}_chave`] = specEntries[i]?.[0] || "";
        row[`spec_${i + 1}_valor`] = specEntries[i]?.[1] || "";
      }

      return row;
    });

    // If no data, add example row
    if (exportData.length === 0) {
      const allCategories = hardwareCategoriesList.map(c => c.key).join(', ');
      exportData.push({
        nome: `CATEGORIAS: ${allCategories}`,
        marca: "Socket: LGA1700, AM5, AM4...",
        modelo: "Memória: DDR5, DDR4",
        preco: "",
        categoria: activeHardwareCategory,
        socket: "",
        memoria_tipo: "",
        form_factor: "",
        tdp: "",
        spec_1_chave: "",
        spec_1_valor: "",
      });
      exportData.push({
        nome: "Exemplo Processador",
        marca: "Intel",
        modelo: "Core i7-13700K",
        preco: 2499.99,
        categoria: activeHardwareCategory,
        socket: "LGA1700",
        memoria_tipo: "",
        form_factor: "",
        tdp: 125,
        spec_1_chave: "Núcleos",
        spec_1_valor: "16",
      });
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hardware");

    // Auto-size columns
    const colWidths = [
      { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
    ];
    for (let i = 0; i < maxSpecs; i++) {
      colWidths.push({ wch: 15 }, { wch: 20 });
    }
    ws["!cols"] = colWidths;

    const now = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `backup_hardware_${activeHardwareCategory}_${now}.xlsx`);
    toast({ 
      title: "Backup baixado", 
      description: `${categoryHardware.length} itens exportados` 
    });
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
        // Skip instruction row (first row with CATEGORIAS)
        if (typeof row.nome === 'string' && row.nome.startsWith('CATEGORIAS:')) continue;
        
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
          socket: row.socket || "",
          memoryType: row.memoria_tipo || "",
          formFactor: row.form_factor || "",
          tdp: parseFloat(row.tdp) || 0,
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

  // Test data from StudioPC with real product images
  const testHardwareData: Record<HardwareCategory, Array<{ name: string; brand: string; model: string; price: number; specs: Record<string, string>; image: string; socket?: string; memoryType?: string }>> = {
    processor: [
      { name: "Processador Intel Core I3-12100F", brand: "Intel", model: "i3-12100F", price: 733, specs: { "Núcleos": "4", "Threads": "8", "Frequência": "3.3GHz", "Turbo": "4.3GHz", "Socket": "LGA1700" }, image: "https://cdn.dooca.store/1841/products/i3-12100f_620x620+fill_ffffff+crop_center.jpg?v=1658776915", socket: "LGA1700" },
      { name: "Processador Intel Core I3-13100F", brand: "Intel", model: "i3-13100F", price: 896, specs: { "Núcleos": "4", "Threads": "8", "Frequência": "3.4GHz", "Turbo": "4.5GHz", "Socket": "LGA1700" }, image: "https://cdn.dooca.store/1841/products/i3-13100f_620x620+fill_ffffff+crop_center.jpg?v=1720017941", socket: "LGA1700" },
      { name: "Processador AMD Ryzen 5 5600", brand: "AMD", model: "Ryzen 5 5600", price: 1099, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "3.5GHz", "Turbo": "4.4GHz", "Socket": "AM4" }, image: "https://cdn.dooca.store/1841/products/2ff90unt6c38wer93hko1hwlejro95h1awto_620x620+fill_ffffff+crop_center.png?v=1716837004", socket: "AM4" },
      { name: "Processador AMD Ryzen 5 5600X", brand: "AMD", model: "Ryzen 5 5600X", price: 1259, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "3.7GHz", "Turbo": "4.6GHz", "Socket": "AM4" }, image: "https://cdn.dooca.store/1841/products/suyugtyjpmyeohwcmw66gowyhfm2jx6qmoaq_620x620+fill_ffffff+crop_center.png?v=1663262182", socket: "AM4" },
      { name: "Processador AMD Ryzen 5 8400F", brand: "AMD", model: "Ryzen 5 8400F", price: 1398, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "4.2GHz", "Turbo": "4.7GHz", "Socket": "AM5" }, image: "https://cdn.dooca.store/1841/products/ryzen-5-8000f_620x620+fill_ffffff+crop_center.jpg?v=1716410996", socket: "AM5" },
      { name: "Processador AMD Ryzen 5 8500G", brand: "AMD", model: "Ryzen 5 8500G", price: 1461, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "3.5GHz", "Turbo": "5.0GHz", "Socket": "AM5", "GPU": "Radeon 740M" }, image: "https://cdn.dooca.store/1841/products/mgmlwhbh6fc1l7ipcvj1qqonqitigdc9epyg_620x620+fill_ffffff+crop_center.png?v=1712158984", socket: "AM5" },
      { name: "Processador AMD Ryzen 5 8600G", brand: "AMD", model: "Ryzen 5 8600G", price: 1870, specs: { "Núcleos": "6", "Threads": "12", "Frequência": "4.3GHz", "Turbo": "5.0GHz", "Socket": "AM5", "GPU": "Radeon 760M" }, image: "https://cdn.dooca.store/1841/products/amd-ryzen-8600g-site_620x620+fill_ffffff+crop_center.png?v=1711572188", socket: "AM5" },
      { name: "Processador AMD Ryzen 7 8700F", brand: "AMD", model: "Ryzen 7 8700F", price: 2299, specs: { "Núcleos": "6", "Threads": "16", "Frequência": "4.1GHz", "Turbo": "5.0GHz", "Socket": "AM5" }, image: "https://cdn.dooca.store/1841/products/ryzen-7-8000f_620x620+fill_ffffff+crop_center.jpg?v=1716411636", socket: "AM5" },
      { name: "Processador AMD Ryzen 7 8700G", brand: "AMD", model: "Ryzen 7 8700G", price: 2593, specs: { "Núcleos": "8", "Threads": "16", "Frequência": "4.2GHz", "Turbo": "5.1GHz", "Socket": "AM5", "GPU": "Radeon 780M" }, image: "https://cdn.dooca.store/1841/products/amd-ryzen-8700g-site_620x620+fill_ffffff+crop_center.png?v=1711652127", socket: "AM5" },
      { name: "Processador AMD Ryzen 9 7900X3D", brand: "AMD", model: "Ryzen 9 7900X3D", price: 5757, specs: { "Núcleos": "12", "Threads": "24", "Turbo": "5.6GHz", "Socket": "AM5", "Cache": "140MB" }, image: "https://cdn.dooca.store/1841/products/ryzen-9-3d-2_620x620+fill_ffffff+crop_center.jpg?v=1707342210", socket: "AM5" },
      { name: "Processador AMD Ryzen 9 7950X", brand: "AMD", model: "Ryzen 9 7950X", price: 5757, specs: { "Núcleos": "16", "Threads": "32", "Frequência": "4.5GHz", "Turbo": "5.7GHz", "Socket": "AM5" }, image: "https://cdn.dooca.store/1841/products/jboczfsd0cx0kv4awxp7fboft4eskorqp8nf_620x620+fill_ffffff+crop_center.jpg?v=1664569468", socket: "AM5" },
    ],
    motherboard: [
      { name: "ASUS Prime A520M-K AM4", brand: "ASUS", model: "Prime A520M-K", price: 449, specs: { "Socket": "AM4", "Chipset": "A520", "RAM": "DDR4" }, image: "https://cdn.dooca.store/1841/products/a520m-k_620x620+fill_ffffff+crop_center.jpg?v=1611589897", socket: "AM4", memoryType: "DDR4" },
      { name: "ASRock B660M Pro RS LGA1700", brand: "ASRock", model: "B660M Pro RS", price: 699, specs: { "Socket": "LGA1700", "Chipset": "B660", "RAM": "DDR4" }, image: "https://cdn.dooca.store/1841/products/b660m-pro-rs_620x620+fill_ffffff+crop_center.jpg?v=1649087447", socket: "LGA1700", memoryType: "DDR4" },
      { name: "Gigabyte B550 Aorus Pro V2", brand: "Gigabyte", model: "B550 Aorus Pro V2", price: 999, specs: { "Socket": "AM4", "Chipset": "B550", "RAM": "DDR4" }, image: "https://cdn.dooca.store/1841/products/b550-aorus-pro_620x620+fill_ffffff+crop_center.jpg?v=1611590004", socket: "AM4", memoryType: "DDR4" },
      { name: "ASUS TUF Gaming B760-Plus", brand: "ASUS", model: "TUF Gaming B760-Plus", price: 1299, specs: { "Socket": "LGA1700", "Chipset": "B760", "RAM": "DDR5" }, image: "https://cdn.dooca.store/1841/products/b760-tuf_620x620+fill_ffffff+crop_center.jpg?v=1675425785", socket: "LGA1700", memoryType: "DDR5" },
      { name: "MSI MAG B650 Tomahawk", brand: "MSI", model: "MAG B650 Tomahawk", price: 1599, specs: { "Socket": "AM5", "Chipset": "B650", "RAM": "DDR5" }, image: "https://cdn.dooca.store/1841/products/b650-tomahawk_620x620+fill_ffffff+crop_center.jpg?v=1664569557", socket: "AM5", memoryType: "DDR5" },
      { name: "Gigabyte Z790 Aorus Elite", brand: "Gigabyte", model: "Z790 Aorus Elite", price: 2499, specs: { "Socket": "LGA1700", "Chipset": "Z790", "RAM": "DDR5" }, image: "https://cdn.dooca.store/1841/products/z790-aorus-elite_620x620+fill_ffffff+crop_center.jpg?v=1664569623", socket: "LGA1700", memoryType: "DDR5" },
      { name: "ASUS ROG Strix X670E-E", brand: "ASUS", model: "ROG Strix X670E-E", price: 3499, specs: { "Socket": "AM5", "Chipset": "X670E", "RAM": "DDR5" }, image: "https://cdn.dooca.store/1841/products/x670e-e_620x620+fill_ffffff+crop_center.jpg?v=1664569715", socket: "AM5", memoryType: "DDR5" },
    ],
    memory: [
      { name: "Memória RAM Gamer 8GB DDR4 3200MHz", brand: "Gamer", model: "DDR4 8GB 3200", price: 279, specs: { "Capacidade": "8GB", "Tipo": "DDR4", "Velocidade": "3200MHz" }, image: "https://cdn.dooca.store/1841/products/8gb-ddr4-gamer_620x620+fill_ffffff+crop_center.jpg?v=1658852099", memoryType: "DDR4" },
      { name: "Memória RAM Gamer 8GB DDR4 3200MHz RGB", brand: "Gamer", model: "DDR4 8GB RGB", price: 321, specs: { "Capacidade": "8GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/rgb-8gb_620x620+fill_ffffff+crop_center.jpg?v=1658784978", memoryType: "DDR4" },
      { name: "Memória RAM Gamer 16GB DDR4 3200MHz (2x8GB)", brand: "Gamer", model: "DDR4 16GB Kit", price: 557, specs: { "Capacidade": "16GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "Kit": "2x8GB" }, image: "https://cdn.dooca.store/1841/products/16gb-ddr4-gamer_620x620+fill_ffffff+crop_center.jpg?v=1658852131", memoryType: "DDR4" },
      { name: "Memória RAM Gamer 16GB DDR4 3200MHz RGB (2x8GB)", brand: "Gamer", model: "DDR4 16GB RGB Kit", price: 642, specs: { "Capacidade": "16GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/16gb-rgb_620x620+fill_ffffff+crop_center.jpg?v=1658784941", memoryType: "DDR4" },
      { name: "Memória RAM Gamer 32GB DDR4 3200MHz (4x8GB ou 2x16GB)", brand: "Gamer", model: "DDR4 32GB Kit", price: 818, specs: { "Capacidade": "32GB", "Tipo": "DDR4", "Velocidade": "3200MHz" }, image: "https://cdn.dooca.store/1841/products/32gb-ddr4_620x620+fill_ffffff+crop_center.jpg?v=1658852149", memoryType: "DDR4" },
      { name: "Memória RAM Gamer 32GB DDR4 3200MHz RGB (4x8GB)", brand: "Gamer", model: "DDR4 32GB RGB Kit", price: 1284, specs: { "Capacidade": "32GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/32gb-1_620x620+fill_ffffff+crop_center.jpg?v=1658784954", memoryType: "DDR4" },
      { name: "Memória RAM Gamer 64GB DDR4 3200MHz RGB (4x16GB)", brand: "Gamer", model: "DDR4 64GB RGB Kit", price: 2568, specs: { "Capacidade": "64GB", "Tipo": "DDR4", "Velocidade": "3200MHz", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/32gb-2_620x620+fill_ffffff+crop_center.jpg?v=1658844575", memoryType: "DDR4" },
      { name: "Corsair Dominator Platinum RGB 64GB DDR5 5600MHz", brand: "Corsair", model: "CMT64GX5M2B5600Z40K", price: 4017, specs: { "Capacidade": "64GB", "Tipo": "DDR5", "Velocidade": "5600MHz", "CL": "40" }, image: "https://cdn.dooca.store/1841/products/memoria-rgb-16gb-corsair-dominator-platinum2_620x620+fill_ffffff+crop_center.jpg?v=1723575878", memoryType: "DDR5" },
    ],
    storage: [
      { name: "SSD 120GB SATA3", brand: "Genérico", model: "SSD 120GB", price: 146, specs: { "Capacidade": "120GB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/120gb-ssd-mpc_620x620+fill_ffffff+crop_center.png?v=1606256087" },
      { name: "SSD 240GB SATA3", brand: "Genérico", model: "SSD 240GB", price: 225, specs: { "Capacidade": "240GB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/240gb-ssd-mpc_620x620+fill_ffffff+crop_center.png?v=1606256205" },
      { name: "SSD 480GB SATA3", brand: "Genérico", model: "SSD 480GB", price: 373, specs: { "Capacidade": "480GB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/480gb-ssd-mpc_620x620+fill_ffffff+crop_center.png?v=1606256266" },
      { name: "SSD 960GB SATA3", brand: "Genérico", model: "SSD 960GB", price: 770, specs: { "Capacidade": "960GB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/960gb-ssd-mpc_620x620+fill_ffffff+crop_center.png?v=1606256405" },
      { name: "SSD 2TB SATA3", brand: "Genérico", model: "SSD 2TB", price: 1026, specs: { "Capacidade": "2TB", "Interface": "SATA3" }, image: "https://cdn.dooca.store/1841/products/ssd-2tb-mpc_620x620+fill_ffffff+crop_center.jpg?v=1697486544" },
    ],
    gpu: [
      { name: "Placa de Vídeo GeForce GT 730 4GB DDR3", brand: "Afox", model: "GT 730 4GB", price: 399, specs: { "VRAM": "4GB DDR3", "Bits": "128" }, image: "https://cdn.dooca.store/1841/products/gt-1030-1_620x620+fill_ffffff+crop_center.png?v=1711393619" },
      { name: "Placa de Vídeo GTX 1650 4GB ASUS TUF Gaming", brand: "ASUS", model: "TUF-GTX1650-O4GD6-P", price: 1299, specs: { "VRAM": "4GB GDDR6", "Série": "GTX 1650" }, image: "https://cdn.dooca.store/1841/products/gtx-1650-asus-tuf_620x620+fill_ffffff+crop_center.jpg?v=1658859415" },
    ],
    psu: [
      { name: "Fonte 300W PFC Ativo", brand: "Genérico", model: "300W", price: 213, specs: { "Potência": "300W", "PFC": "Ativo" }, image: "https://cdn.dooca.store/1841/products/fonte-300w-spark-pcyes_620x620+fill_ffffff+crop_center.png?v=1710874584" },
      { name: "Fonte 500W PFC Ativo", brand: "Genérico", model: "500W", price: 227, specs: { "Potência": "500W", "PFC": "Ativo" }, image: "https://cdn.dooca.store/1841/products/fonte-350w-site_620x620+fill_ffffff+crop_center.jpg?v=1645711594" },
      { name: "Fonte 500W 80 Plus", brand: "Genérico", model: "500W 80+", price: 227, specs: { "Potência": "500W", "Certificação": "80 Plus" }, image: "https://cdn.dooca.store/1841/products/vtk-450-fonte_620x620+fill_ffffff+crop_center.png?v=1651518091" },
      { name: "Fonte 600W 80 Plus Bronze", brand: "Genérico", model: "600W Bronze", price: 338, specs: { "Potência": "600W", "Certificação": "80 Plus Bronze" }, image: "https://cdn.dooca.store/1841/products/fonte-600w_620x620+fill_ffffff+crop_center.jpg?v=1618664984" },
      { name: "Fonte Gamer 750W 80 Plus Bronze", brand: "Genérico", model: "750W Bronze", price: 638, specs: { "Potência": "750W", "Certificação": "80 Plus Bronze" }, image: "https://cdn.dooca.store/1841/products/atlas-750_620x620+fill_ffffff+crop_center.jpg?v=1677855562" },
      { name: "Fonte Corsair TX650M 650W 80 Plus Gold", brand: "Corsair", model: "TX650M", price: 810, specs: { "Potência": "650W", "Certificação": "80 Plus Gold" }, image: "https://cdn.dooca.store/1841/products/corsair-tx650m-1_620x620+fill_ffffff+crop_center.jpg?v=1624627933" },
      { name: "Fonte GameMax GX800 800W 80 Plus Gold", brand: "GameMax", model: "GX800", price: 934, specs: { "Potência": "800W", "Certificação": "80 Plus Gold", "PFC": "Ativo" }, image: "https://cdn.dooca.store/1841/products/fonte-gx800_620x620+fill_ffffff+crop_center.jpg?v=1699049513" },
      { name: "Fonte GX850 PRO 850W 80 Plus Gold Full Modular ATX 3.0", brand: "GameMax", model: "GX850 PRO", price: 1127, specs: { "Potência": "850W", "Certificação": "80 Plus Gold", "Modular": "Full", "ATX": "3.0" }, image: "https://cdn.dooca.store/1841/products/gx850-bk1_620x620+fill_ffffff+crop_center.jpg?v=1699050518" },
    ],
    case: [
      { name: "Gabinete Gamer GBT X500MW C/ 3 Fans - Branco", brand: "GBT", model: "X500MW", price: 218, specs: { "Fans": "3", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/gbt-500-branco-1_620x620+fill_ffffff+crop_center.jpg?v=1738096965" },
      { name: "Gabinete Gamer Aquario CG-L4RE Curvo - Preto", brand: "Aquario", model: "CG-L4RE", price: 219, specs: { "Frente": "Curvada", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/kmex-curvo-micro-preto_620x620+fill_ffffff+crop_center.jpg?v=1755025143" },
      { name: "Gabinete Gamemax Diamond ARGB C/ 1 Fan - Preto", brand: "Gamemax", model: "Diamond", price: 225, specs: { "Fans": "1", "RGB": "ARGB", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/gamemax-diamond-2_620x620+fill_ffffff+crop_center.jpg?v=1705960633" },
      { name: "Gabinete Fortrek Black Hawk RGB C/ 1 Fan - Preto", brand: "Fortrek", model: "Black Hawk", price: 226, specs: { "Fans": "1", "RGB": "Sim", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/black-hawk-site_620x620+fill_ffffff+crop_center.png?v=1644439629" },
      { name: "Gabinete Gamer Aquario Space CG-P2R4 ATX - Preto", brand: "Aquario", model: "Space CG-P2R4", price: 260, specs: { "Formato": "ATX", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/kmex-aquario-grande-1-preto_620x620+fill_ffffff+crop_center.jpg?v=1725977709" },
      { name: "Gabinete Forcefield TWR Black Vulcan PCYES - Preto", brand: "PCYES", model: "Forcefield TWR", price: 298, specs: { "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/forcefield-twr-preto-1_620x620+fill_ffffff+crop_center.jpg?v=1726248032" },
      { name: "Gabinete T-Dagger Cube Black - Preto", brand: "T-Dagger", model: "Cube Black", price: 398, specs: { "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/cube-blacksite_620x620+fill_ffffff+crop_center.jpg?v=1656536621" },
      { name: "Gabinete Cougar MX440 MESH RGB C/ 3 FANS - Preto", brand: "Cougar", model: "MX440 MESH RGB", price: 466, specs: { "Formato": "Mid-Tower", "Fans": "3", "RGB": "Sim", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/cougar-mx440-mesh-rgb-preto-01-studiopc_620x620+fill_ffffff+crop_center.jpg?v=1686264099" },
      { name: "Gabinete Liketec Madness Vidro Curvo - Preto", brand: "Liketec", model: "Madness", price: 499, specs: { "Vidro": "Curvo", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/5n1n6pdjct9aeqdkq18vefgokq39vehczraq_620x620+fill_ffffff+crop_center.jpg?v=1730388962" },
      { name: "Gabinete DeepCool CH560 WH ARGB C/ 4 Fans - Branco", brand: "DeepCool", model: "CH560 WH", price: 549, specs: { "Fans": "4", "RGB": "ARGB", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/ch560-branco-1_620x620+fill_ffffff+crop_center.jpg?v=1706029894" },
      { name: "Gabinete Cougar MX430 Air RGB C/ 3 Fans - Branco", brand: "Cougar", model: "MX430 Air RGB", price: 559, specs: { "Fans": "3", "RGB": "Sim", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/mx-430-air-white-1_620x620+fill_ffffff+crop_center.jpg?v=1660233337" },
      { name: "Gabinete Gamdias Atlas M1 Display C/ 3 Fans - Preto", brand: "Gamdias", model: "Atlas M1", price: 561, specs: { "Display": "Sim", "Fans": "3", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/gamdias-m1-1_620x620+fill_ffffff+crop_center.jpg?v=1743861352" },
    ],
    cooler: [
      { name: "Water Cooler LE300 Rainbow 120mm Deepcool - Preto", brand: "Deepcool", model: "LE300", price: 278, specs: { "Tipo": "AIO 120mm", "RGB": "Rainbow" }, image: "https://cdn.dooca.store/1841/products/deepcool-le300-site-120mm_620x620+fill_ffffff+crop_center.jpg?v=1701459060" },
      { name: "Water Cooler 240mm ARGB - Branco", brand: "Gamdias", model: "Aura GL240 V2", price: 356, specs: { "Tipo": "AIO 240mm", "RGB": "ARGB", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/gamdias-aura-gl-240-v2-wc-240-site-2_620x620+fill_ffffff+crop_center.jpg?v=1717701586" },
      { name: "Water Cooler 240mm ARGB - Preto", brand: "Gamdias", model: "Aura GL240 V2", price: 356, specs: { "Tipo": "AIO 240mm", "RGB": "ARGB", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/gamdias-aura-240mm-preto-2_620x620+fill_ffffff+crop_center.jpg?v=1722865291" },
      { name: "Water Cooler Spectra ARGB 240mm Onepower", brand: "Onepower", model: "Spectra WC-501", price: 368, specs: { "Tipo": "AIO 240mm", "RGB": "ARGB" }, image: "https://cdn.dooca.store/1841/products/water-240-one-power_620x620+fill_ffffff+crop_center.jpg?v=1700770925" },
      { name: "Water Cooler Spectra ARGB 360mm Onepower", brand: "Onepower", model: "Spectra WC-502", price: 438, specs: { "Tipo": "AIO 360mm", "RGB": "ARGB" }, image: "https://cdn.dooca.store/1841/products/water-360-one-power_620x620+fill_ffffff+crop_center.jpg?v=1700771538" },
      { name: "Water Cooler LE500 Rainbow 240mm Deepcool - Preto", brand: "Deepcool", model: "LE500", price: 457, specs: { "Tipo": "AIO 240mm", "RGB": "Rainbow" }, image: "https://cdn.dooca.store/1841/products/le-500-wc-1-2_620x620+fill_ffffff+crop_center.jpg?v=1667312980" },
      { name: "Water Cooler Aura GL360 V2 ARGB 360mm - Branco", brand: "Gamdias", model: "Aura GL360 V2", price: 520, specs: { "Tipo": "AIO 360mm", "RGB": "ARGB", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/water-aura-360-branco_620x620+fill_ffffff+crop_center.jpg?v=1751724214" },
      { name: "Water Cooler LT520 RGB 240mm Deepcool - Branco", brand: "Deepcool", model: "LT520 WH", price: 868, specs: { "Tipo": "AIO 240mm", "RGB": "Sim", "Cor": "Branco" }, image: "https://cdn.dooca.store/1841/products/gls9ym6wxa8xpzooph5htxdhh4lnbip1d2yt_620x620+fill_ffffff+crop_center.jpg?v=1694614011" },
      { name: "Water Cooler LT520 RGB 240mm Deepcool - Preto", brand: "Deepcool", model: "LT520", price: 868, specs: { "Tipo": "AIO 240mm", "RGB": "Sim", "Cor": "Preto" }, image: "https://cdn.dooca.store/1841/products/watercooler-lt520-240mm-1_620x620+fill_ffffff+crop_center.jpg?v=1673986878" },
      { name: "Water Cooler Lian Li GALAHAD II TRINITY RGB 240mm", brand: "Lian Li", model: "GA2T24", price: 951, specs: { "Tipo": "AIO 240mm", "RGB": "Sim" }, image: "https://cdn.dooca.store/1841/products/lian-li-galahad-trinity-2-preto3_620x620+fill_ffffff+crop_center.jpg?v=1698267044" },
      { name: "Water Cooler PCYES Vision 240mm Display LCD - Preto", brand: "PCYES", model: "VS240BV", price: 998, specs: { "Tipo": "AIO 240mm", "RGB": "ARGB", "Display": "LCD 2.1\"" }, image: "https://cdn.dooca.store/1841/products/pcyes-water-cooler-vision-preto-1_620x620+fill_ffffff+crop_center.jpg?v=1708723478" },
      { name: "Water Cooler PCYES Vision 240mm Display LCD - Branco", brand: "PCYES", model: "VS240WG", price: 1066, specs: { "Tipo": "AIO 240mm", "RGB": "ARGB", "Display": "LCD 2.1\"" }, image: "https://cdn.dooca.store/1841/products/pcyes-water-cooler-vision-branco-1_620x620+fill_ffffff+crop_center.jpg?v=1708724104" },
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

    const categoryLabel = hardwareCategoriesList.find(c => c.key === category)?.label || category;
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

  // Bulk upload/export products - exports ALL existing products as backup
  function downloadProductExcelTemplate() {
    // Find max number of specs across all products
    let maxSpecs = 5;
    products.forEach(product => {
      const specCount = Object.keys(product.specs || {}).length;
      if (specCount > maxSpecs) maxSpecs = specCount;
    });

    // Build export data from existing products
    const exportData = products.map(product => {
      const row: Record<string, any> = {
        id: product.id,
        titulo: product.title,
        subtitulo: product.subtitle || "",
        descricao: product.description || "",
        preco: product.totalPrice,
        tipo: product.productType || "notebook",
        download_url: product.downloadUrl || "",
      };

      // Add specs dynamically
      const specEntries = Object.entries(product.specs || {});
      for (let i = 0; i < maxSpecs; i++) {
        row[`spec_${i + 1}_chave`] = specEntries[i]?.[0] || "";
        row[`spec_${i + 1}_valor`] = specEntries[i]?.[1] || "";
      }

      return row;
    });

    // If no data, add instructions and example row
    if (exportData.length === 0) {
      const allTypes = productTypes.map(t => t.key).join(', ');
      exportData.push({
        id: "",
        titulo: `TIPOS DISPONÍVEIS: ${allTypes}`,
        subtitulo: "Preencha a partir da linha 3",
        descricao: "",
        preco: "",
        tipo: "",
        download_url: "Apenas para automações",
        spec_1_chave: "",
        spec_1_valor: "",
      });
      exportData.push({
        id: "",
        titulo: "Produto Exemplo",
        subtitulo: "Descrição curta",
        descricao: "Descrição completa do produto",
        preco: 999.99,
        tipo: "notebook",
        download_url: "",
        spec_1_chave: "Processador",
        spec_1_valor: "Intel Core i7",
      });
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");

    // Auto-size columns
    const colWidths = [
      { wch: 40 }, { wch: 40 }, { wch: 30 }, { wch: 50 }, { wch: 12 }, { wch: 20 }, { wch: 40 },
    ];
    for (let i = 0; i < maxSpecs; i++) {
      colWidths.push({ wch: 15 }, { wch: 20 });
    }
    ws["!cols"] = colWidths;

    const now = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `backup_produtos_${now}.xlsx`);
    toast({ 
      title: "Backup baixado", 
      description: `${products.length} produtos exportados` 
    });
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
        // Skip instruction row (first row with TIPOS DISPONÍVEIS)
        if (typeof row.titulo === 'string' && row.titulo.startsWith('TIPOS DISPONÍVEIS:')) continue;
        
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
          description: row.descricao || "",
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
      <div className="flex min-h-screen items-center justify-center p-4" style={{ backgroundColor: '#DC2626' }}>
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            {company?.logo ? (
              <img src={company.logo} alt={company.name || 'Logo'} className="mx-auto h-20 mb-4 object-contain" />
            ) : (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Building2 className="h-16 w-16 text-primary" />
                <span className="font-bold text-2xl text-gray-800">{company?.name || 'Sua Empresa'}</span>
              </div>
            )}
            <p className="mt-2 text-gray-600">Acesso restrito</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Usuário ou Email</label>
              <input
                type="text"
                value={loginData.user}
                onChange={(e) => setLoginData(prev => ({ ...prev, user: e.target.value }))}
                className="w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
                style={{ borderColor: '#E5E7EB' }}
                placeholder="Digite seu usuário ou email"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Senha</label>
              <input
                type="password"
                value={loginData.pass}
                onChange={(e) => setLoginData(prev => ({ ...prev, pass: e.target.value }))}
                className="w-full rounded-lg border-2 bg-white px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
                style={{ borderColor: '#E5E7EB' }}
                placeholder="Digite sua senha"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-lg py-3 font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#DC2626' }}
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">ou</span>
              </div>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="mt-4 w-full flex items-center justify-center gap-3 rounded-lg border-2 border-gray-200 bg-white py-3 text-gray-700 font-medium transition-colors hover:bg-gray-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
              Apenas administradores cadastrados podem fazer login
            </p>
          </div>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm font-medium hover:underline"
              style={{ color: '#DC2626' }}
            >
              ← Voltar ao site
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeHwCat = hardwareCategoriesList.find(c => c.key === activeHardwareCategory);
  const ActiveHardwareIcon = activeHwCat ? getIconFromKey(activeHwCat.icon) : Cpu;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEF2F2' }}>
      <RedWhiteHeader hideCart hideNavigation />
      
      <main className="py-12">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold" style={{ color: '#DC2626' }}>Painel de Controle</h1>
              <p className="mt-2 text-gray-600">Gerencie produtos e componentes</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/extract-products')}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-lg transition-all hover:opacity-90"
                style={{ backgroundColor: '#DC2626' }}
              >
                <Sparkles className="h-5 w-5" />
                Importar em Massa
              </button>
              {activeTab === 'products' && (
                  <button
                    onClick={() => openProductEditor()}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-5 w-5" />
                    Novo Produto
                  </button>
              )}
              {activeTab === 'hardware' && (
                  <button
                    onClick={() => openHardwareEditor()}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-glow transition-colors hover:bg-primary/90"
                  >
                    <Plus className="h-5 w-5" />
                    Novo Componente
                  </button>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg border-2 px-4 py-3 font-semibold transition-colors hover:opacity-90"
                style={{ borderColor: '#DC2626', color: '#DC2626', backgroundColor: 'white' }}
              >
                Sair
              </button>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'dashboard' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'products' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Monitor className="h-5 w-5" />
              Montar Configurações
            </button>
            <button
              onClick={() => setActiveTab('simple_products')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'simple_products' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Package className="h-5 w-5" />
              Produtos Simples
            </button>
            <button
              onClick={() => setActiveTab('hardware')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'hardware' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Cpu className="h-5 w-5" />
              Hardware (PC)
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'categories' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Tag className="h-5 w-5" />
              Gerenciar Categorias
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'company' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Building2 className="h-5 w-5" />
              Dados da Empresa
            </button>
            <button
              onClick={() => setActiveTab('carousels')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'carousels' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Images className="h-5 w-5" />
              Carrosséis
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'admins' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Users className="h-5 w-5" />
              Administradores
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={activeTab === 'settings' 
                ? { backgroundColor: '#DC2626', color: 'white' } 
                : { backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Settings className="h-5 w-5" />
              Configurações
            </button>
            <button
              onClick={() => navigate('/email-marketing')}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
              style={{ backgroundColor: 'white', color: '#374151', border: '1px solid #E5E7EB' }}
            >
              <Mail className="h-5 w-5" />
              Email Marketing
            </button>
          </div>

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Gerenciar Categorias</h2>
                  <p className="text-muted-foreground mt-1">
                    Crie, edite e organize as categorias dos seus produtos. Arraste para reordenar.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewCategoryKey("");
                    setNewCategoryLabel("");
                    setNewCategoryIcon("tag");
                    setShowNewCategoryModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90"
                >
                  <Plus className="h-5 w-5" />
                  Nova Categoria
                </button>
              </div>

              {/* Categories Grid with drag-and-drop */}
              <div className="rounded-xl border border-border bg-card p-6">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleCategoryDragEnd}
                >
                  <SortableContext items={customCategoriesList.map(c => c.key)} strategy={horizontalListSortingStrategy}>
                    <div className="flex flex-wrap gap-3">
                      {customCategoriesList.map((cat) => (
                        <SortableCategoryButton
                          key={cat.key}
                          category={cat}
                          isSelected={selectedCategoryFilter === cat.key}
                          onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === cat.key ? null : cat.key)}
                          onDoubleClick={() => {
                            setEditingCategory({ key: cat.key, label: cat.label, icon: cat.icon });
                            setEditCategoryLabel(cat.label);
                            setEditCategoryIcon(cat.icon || 'tag');
                            setShowEditCategoryModal(true);
                          }}
                          onDelete={async () => {
                            if (confirm(`Excluir categoria "${cat.label}"?`)) {
                              await removeCustomCategory(cat.key);
                              const updatedCategories = await getCustomCategories();
                              setCustomCategoriesList(updatedCategories);
                              if (selectedCategoryFilter === cat.key) {
                                setSelectedCategoryFilter(null);
                              }
                              toast({ title: "Categoria removida" });
                            }
                          }}
                        />
                      ))}
                      {customCategoriesList.length === 0 && (
                        <p className="text-muted-foreground text-center py-8 w-full">
                          Nenhuma categoria cadastrada. Clique em "Nova Categoria" para criar.
                        </p>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Dica:</strong> Clique duplo em uma categoria para editar. Clique no X para remover.
                  </p>
                </div>
              </div>

              {/* Edit Category Modal */}
              {showEditCategoryModal && editingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Editar Categoria</h3>
                      <button
                        onClick={() => {
                          setShowEditCategoryModal(false);
                          setEditingCategory(null);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome da Categoria</label>
                        <input
                          type="text"
                          value={editCategoryLabel}
                          onChange={(e) => setEditCategoryLabel(e.target.value)}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          placeholder="Ex: Notebooks"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Ícone</label>
                        <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg bg-background">
                          {availableIcons.map((iconOption) => {
                            const IconComp = iconOption.icon;
                            return (
                              <button
                                key={iconOption.key}
                                type="button"
                                onClick={() => setEditCategoryIcon(iconOption.key)}
                                className={`p-2 rounded-lg transition-colors ${
                                  editCategoryIcon === iconOption.key
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                                }`}
                                title={iconOption.key}
                              >
                                <IconComp className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setShowEditCategoryModal(false);
                            setEditingCategory(null);
                          }}
                          className="flex-1 rounded-lg border border-border px-4 py-2 text-foreground hover:bg-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={async () => {
                            if (!editCategoryLabel.trim()) {
                              toast({ title: "Erro", description: "Nome é obrigatório", variant: "destructive" });
                              return;
                            }
                            const success = await updateCustomCategory(
                              editingCategory.key,
                              editCategoryLabel.trim(),
                              editCategoryIcon
                            );
                            if (success) {
                              const updatedCategories = await getCustomCategories();
                              setCustomCategoriesList(updatedCategories);
                              toast({ title: "Categoria atualizada" });
                              setShowEditCategoryModal(false);
                              setEditingCategory(null);
                            } else {
                              toast({ title: "Erro", description: "Falha ao atualizar categoria", variant: "destructive" });
                            }
                          }}
                          className="flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/80"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New Category Modal */}
              {showNewCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl border border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Nova Categoria</h3>
                      <button
                        onClick={() => setShowNewCategoryModal(false)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Chave (identificador único)</label>
                        <input
                          type="text"
                          value={newCategoryKey}
                          onChange={(e) => setNewCategoryKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                          placeholder="ex: eletronicos"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome da Categoria</label>
                        <input
                          type="text"
                          value={newCategoryLabel}
                          onChange={(e) => setNewCategoryLabel(e.target.value)}
                          placeholder="ex: Eletrônicos"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-2">Ícone</label>
                        <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg">
                          {availableIcons.slice(0, 80).map((iconItem) => {
                            const IconComponent = iconItem.icon;
                            return (
                              <button
                                key={iconItem.key}
                                type="button"
                                onClick={() => setNewCategoryIcon(iconItem.key)}
                                className={`p-2 rounded-lg transition-colors ${
                                  newCategoryIcon === iconItem.key
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary hover:bg-secondary/80'
                                }`}
                                title={iconItem.key}
                              >
                                <IconComponent className="h-4 w-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={() => setShowNewCategoryModal(false)}
                          className="flex-1 rounded-lg border border-border px-4 py-2 text-foreground hover:bg-secondary"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={async () => {
                            if (!newCategoryKey.trim() || !newCategoryLabel.trim()) {
                              toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
                              return;
                            }
                            const success = await addCustomCategory(newCategoryKey.trim(), newCategoryLabel.trim(), newCategoryIcon);
                            if (success) {
                              const updatedCategories = await getCustomCategories();
                              setCustomCategoriesList(updatedCategories);
                              toast({ title: "Categoria adicionada" });
                              setShowNewCategoryModal(false);
                              setNewCategoryKey("");
                              setNewCategoryLabel("");
                              setNewCategoryIcon("tag");
                            } else {
                              toast({ title: "Erro", description: "Falha ao adicionar categoria", variant: "destructive" });
                            }
                          }}
                          className="flex-1 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/80"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <AdminDashboard />
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <>
              {/* Search and bulk actions for products */}
              <div className="mb-4 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="Buscar produtos por nome, tipo..."
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedProducts.size === 0) {
                        // Select all products first
                        const allIds = new Set(getFilteredProducts().map(p => p.id));
                        setSelectedProducts(allIds);
                        toast({ title: "Produtos selecionados", description: `${allIds.size} produtos selecionados para classificação` });
                      }
                      setShowAIClassifier(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Classificar com IA {selectedProducts.size > 0 && `(${selectedProducts.size})`}
                  </button>
                  {selectedProducts.size > 0 && (
                    <>
                      <button
                        onClick={() => setShowBulkEditModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar ({selectedProducts.size})
                      </button>
                      <button
                        onClick={handleBulkDeleteProducts}
                        className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir ({selectedProducts.size})
                      </button>
                    </>
                  )}
                  <button
                    onClick={downloadProductExcelTemplate}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Template
                  </button>
                  <label className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                    <Upload className="h-4 w-4" />
                    Importar Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleProductBulkUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary">
                      <tr>
                        <th className="px-4 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const filtered = getFilteredProducts();
                              return filtered.length > 0 && filtered.every(p => selectedProducts.has(p.id));
                            })()}
                            onChange={toggleAllProducts}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Mídia</th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (productSortColumn === 'title') {
                              setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProductSortColumn('title');
                              setProductSortDirection('asc');
                            }
                          }}
                        >
                          Título {productSortColumn === 'title' && (productSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (productSortColumn === 'type') {
                              setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProductSortColumn('type');
                              setProductSortDirection('asc');
                            }
                          }}
                        >
                          Tipo {productSortColumn === 'type' && (productSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (productSortColumn === 'price') {
                              setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProductSortColumn('price');
                              setProductSortDirection('asc');
                            }
                          }}
                        >
                          Preço {productSortColumn === 'price' && (productSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {getFilteredProducts()
                        .sort((a, b) => {
                          const direction = productSortDirection === 'asc' ? 1 : -1;
                          if (productSortColumn === 'title') {
                            return a.title.localeCompare(b.title) * direction;
                          } else if (productSortColumn === 'type') {
                            const typeA = a.productType || '';
                            const typeB = b.productType || '';
                            return typeA.localeCompare(typeB) * direction;
                          } else {
                            return ((a.totalPrice || 0) - (b.totalPrice || 0)) * direction;
                          }
                        }).map((product) => {
                        const typeInfo = productTypes.find(t => t.key === product.productType);
                        const TypeIcon = typeInfo?.icon || Tag;
                        return (
                          <tr key={product.id} className={`hover:bg-secondary/50 ${selectedProducts.has(product.id) ? 'bg-primary/10' : ''}`}>
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.id)}
                                onChange={() => toggleProductSelection(product.id)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="px-4 py-4">
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
                            <td className="px-4 py-4 font-medium text-foreground">{product.title}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <TypeIcon className="h-4 w-4" />
                                {typeInfo?.label || product.productType || 'Sem tipo'}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-semibold text-primary">
                              {product.productType === 'automacao' ? 'Download' : formatPrice(product.totalPrice)}
                            </td>
                            <td className="px-4 py-4">
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
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
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
            <div className="max-w-4xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Configuração da Empresa</h2>
                <p className="text-muted-foreground mt-1">
                  Configure todos os dados da sua empresa. Estas informações serão exibidas em todo o site.
                </p>
              </div>
              <CompanySettingsForm
                companyData={companyData}
                onSave={async (data) => {
                  setSavingCompany(true);
                  try {
                    await api.saveCompany(data);
                    setCompanyData(data);
                    await refreshCompany();
                    toast({ title: "Dados salvos com sucesso!" });
                  } catch (error) {
                    toast({ title: "Erro ao salvar", variant: "destructive" });
                  } finally {
                    setSavingCompany(false);
                  }
                }}
                isSaving={savingCompany}
              />
            </div>
          )}

          {/* Carousels Tab */}
          {activeTab === 'carousels' && (
            <CarouselManager />
          )}

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <div className="rounded-xl border bg-white p-6 shadow-sm" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#111827' }}>Gerenciar Administradores</h2>
                  <p className="text-sm" style={{ color: '#6B7280' }}>Cadastre e gerencie os administradores do sistema</p>
                </div>
                <button
                  onClick={() => setShowNewAdminModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#DC2626' }}
                >
                  <UserPlus className="h-5 w-5" />
                  Novo Administrador
                </button>
              </div>

              {/* Admins List */}
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: '#E5E7EB' }}>
                <table className="w-full">
                  <thead style={{ backgroundColor: '#F9FAFB' }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>Função</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#374151' }}>Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold" style={{ color: '#374151' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: '#E5E7EB' }}>
                    {adminsList.map((admin) => (
                      <tr key={admin.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {admin.avatar ? (
                              <img src={admin.avatar} alt={admin.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
                                <Shield className="h-5 w-5" style={{ color: '#DC2626' }} />
                              </div>
                            )}
                            <span className="font-medium" style={{ color: '#111827' }}>{admin.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ color: '#6B7280' }}>{admin.email}</td>
                        <td className="px-6 py-4">
                          <span 
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                            style={admin.role === 'super_admin' 
                              ? { backgroundColor: '#FEE2E2', color: '#DC2626' }
                              : { backgroundColor: '#E5E7EB', color: '#374151' }}
                          >
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                            style={admin.active 
                              ? { backgroundColor: '#D1FAE5', color: '#059669' }
                              : { backgroundColor: '#FEE2E2', color: '#DC2626' }}
                          >
                            {admin.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {admin.role !== 'super_admin' && (
                              <button
                                onClick={() => toggleAdminActive(admin)}
                                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                                style={{ color: admin.active ? '#DC2626' : '#059669' }}
                                title={admin.active ? 'Desativar' : 'Ativar'}
                              >
                                {admin.active ? <X className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {adminsList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center" style={{ color: '#6B7280' }}>
                          Nenhum administrador cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">Configurações do Sistema</h2>
                <p className="text-muted-foreground mt-1">
                  Configure as integrações e APIs globais do seu sistema white-label.
                </p>
              </div>
              <GlobalSettingsForm />
            </div>
          )}

          {/* New Admin Modal */}
          {showNewAdminModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold" style={{ color: '#111827' }}>Novo Administrador</h3>
                  <button
                    onClick={() => setShowNewAdminModal(false)}
                    className="hover:opacity-70"
                    style={{ color: '#6B7280' }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Nome *</label>
                    <input
                      type="text"
                      value={newAdminData.name}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-lg border-2 px-4 py-2 focus:outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#111827' }}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Email *</label>
                    <input
                      type="email"
                      value={newAdminData.email}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-lg border-2 px-4 py-2 focus:outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#111827' }}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Senha (opcional para login Google)</label>
                    <input
                      type="password"
                      value={newAdminData.password}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full rounded-lg border-2 px-4 py-2 focus:outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#111827' }}
                      placeholder="Deixe em branco para login apenas via Google"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>Telefone</label>
                    <input
                      type="tel"
                      value={newAdminData.phone}
                      onChange={(e) => setNewAdminData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-lg border-2 px-4 py-2 focus:outline-none"
                      style={{ borderColor: '#E5E7EB', color: '#111827' }}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewAdminModal(false)}
                      className="flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-colors hover:bg-gray-50"
                      style={{ borderColor: '#E5E7EB', color: '#374151' }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingAdmin}
                      className="flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: '#DC2626' }}
                    >
                      {isSavingAdmin ? 'Salvando...' : 'Cadastrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Simple Products Tab - Individual product registration without mandatory hardware */}
          {activeTab === 'simple_products' && (
            <>
              {/* Search and actions for simple products */}
              <div className="mb-4 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    placeholder="Buscar produtos por nome, tipo..."
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selectedProducts.size === 0) {
                        const allIds = new Set(getFilteredProducts().filter(p => {
                          const type = p.productType || '';
                          return type !== 'pc' && type !== 'kit';
                        }).map(p => p.id));
                        setSelectedProducts(allIds);
                        toast({ title: "Produtos selecionados", description: `${allIds.size} produtos selecionados` });
                      }
                      setShowAIClassifier(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Classificar com IA {selectedProducts.size > 0 && `(${selectedProducts.size})`}
                  </button>
                  {selectedProducts.size > 0 && (
                    <>
                      <button
                        onClick={() => setShowBulkEditModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar ({selectedProducts.size})
                      </button>
                      <button
                        onClick={handleBulkDeleteProducts}
                        className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/80"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir ({selectedProducts.size})
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setProductFormData({
                        ...defaultProductFormData,
                        productType: 'acessorio',
                      });
                      setEditingProductId(null);
                      setIsEditingProduct(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#DC2626' }}
                  >
                    <Plus className="h-4 w-4" />
                    Novo Produto
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary">
                      <tr>
                        <th className="px-4 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={(() => {
                              const filtered = getFilteredProducts().filter(p => {
                                const type = p.productType || '';
                                return type !== 'pc' && type !== 'kit';
                              });
                              return filtered.length > 0 && filtered.every(p => selectedProducts.has(p.id));
                            })()}
                            onChange={toggleAllProducts}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Mídia</th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (productSortColumn === 'title') {
                              setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProductSortColumn('title');
                              setProductSortDirection('asc');
                            }
                          }}
                        >
                          Título {productSortColumn === 'title' && (productSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (productSortColumn === 'type') {
                              setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProductSortColumn('type');
                              setProductSortDirection('asc');
                            }
                          }}
                        >
                          Tipo {productSortColumn === 'type' && (productSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (productSortColumn === 'price') {
                              setProductSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setProductSortColumn('price');
                              setProductSortDirection('asc');
                            }
                          }}
                        >
                          Preço {productSortColumn === 'price' && (productSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {getFilteredProducts()
                        .filter((p) => {
                          // Only show products that are NOT pc or kit (those go to "Montar Configurações")
                          const type = p.productType || '';
                          return type !== 'pc' && type !== 'kit';
                        })
                        .sort((a, b) => {
                          const direction = productSortDirection === 'asc' ? 1 : -1;
                          if (productSortColumn === 'title') {
                            return a.title.localeCompare(b.title) * direction;
                          } else if (productSortColumn === 'type') {
                            const typeA = a.productType || '';
                            const typeB = b.productType || '';
                            return typeA.localeCompare(typeB) * direction;
                          } else {
                            return ((a.totalPrice || 0) - (b.totalPrice || 0)) * direction;
                          }
                        }).map((product) => {
                        const typeInfo = productTypes.find(t => t.key === product.productType);
                        const TypeIcon = typeInfo?.icon || Tag;
                        return (
                          <tr key={product.id} className={`hover:bg-secondary/50 ${selectedProducts.has(product.id) ? 'bg-primary/10' : ''}`}>
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selectedProducts.has(product.id)}
                                onChange={() => toggleProductSelection(product.id)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                              />
                            </td>
                            <td className="px-4 py-4">
                              {product.media?.[0]?.url ? (
                                <img
                                  src={product.media[0].url}
                                  alt=""
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-foreground">{product.title}</p>
                              <p className="text-sm text-muted-foreground">{product.subtitle}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                                <TypeIcon className="h-4 w-4" />
                                {typeInfo?.label || product.productType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-foreground">
                              R$ {(product.totalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => openProductEditor(product)}
                                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleProductDelete(product.id)}
                                  className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Hardware Tab */}
          {activeTab === 'hardware' && (
            <>
              {/* Hardware Category Tabs */}
              <div className="mb-6 flex flex-wrap gap-2">
                {hardwareCategoriesList.map((cat) => {
                  const Icon = getIconFromKey(cat.icon);
                  return (
                    <button
                      key={cat.key}
                      onClick={() => {
                        setActiveHardwareCategory(cat.key);
                        setActiveHardwareFilter({});
                      }}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors group relative ${
                        activeHardwareCategory === cat.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {cat.label}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingHardwareCategory(cat);
                          setNewHardwareCatKey(cat.key);
                          setNewHardwareCatLabel(cat.label);
                          setNewHardwareCatIcon(cat.icon || 'box');
                          setNewHardwareCatFilters(cat.filters || []);
                          setShowEditHardwareCategoryModal(true);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Pencil className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
                {/* Add new hardware category button */}
                <button
                  onClick={() => {
                    setNewHardwareCatKey("");
                    setNewHardwareCatLabel("");
                    setNewHardwareCatIcon("box");
                    setNewHardwareCatFilters([]);
                    setShowNewHardwareCategoryModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Nova Subcategoria
                </button>
              </div>

              {/* Filters for active category */}
              {activeHwCat?.filters && activeHwCat.filters.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-4">
                  <span className="text-sm text-muted-foreground">Filtrar por:</span>
                  {activeHwCat.filters.map((filter) => (
                    <select
                      key={filter.field}
                      value={activeHardwareFilter[filter.field] || ''}
                      onChange={(e) => setActiveHardwareFilter(prev => ({ ...prev, [filter.field]: e.target.value }))}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">{filter.label}: Todos</option>
                      {filter.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ))}
                  {Object.keys(activeHardwareFilter).some(k => activeHardwareFilter[k]) && (
                    <button
                      onClick={() => setActiveHardwareFilter({})}
                      className="text-sm text-primary hover:underline"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Search and bulk actions for hardware */}
              <div className="mb-4 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={hardwareSearchTerm}
                    onChange={(e) => setHardwareSearchTerm(e.target.value)}
                    placeholder="Buscar hardware por nome, marca, modelo..."
                    className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  {selectedHardware.size > 0 && (
                    <button
                      onClick={handleBulkDeleteHardware}
                      className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir ({selectedHardware.size})
                    </button>
                  )}
                  <button
                    onClick={downloadExcelTemplate}
                    className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                  >
                    <Download className="h-4 w-4" />
                    Baixar Template
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
              </div>

              {loading ? (
                <div className="h-64 animate-pulse rounded-xl bg-card" />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary">
                      <tr>
                        <th className="px-4 py-4 text-left">
                          <input
                            type="checkbox"
                            checked={hardwareList.length > 0 && selectedHardware.size === hardwareList.length}
                            onChange={toggleAllHardware}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Imagem</th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (hardwareSortColumn === 'name') {
                              setHardwareSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setHardwareSortColumn('name');
                              setHardwareSortDirection('asc');
                            }
                          }}
                        >
                          Nome {hardwareSortColumn === 'name' && (hardwareSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (hardwareSortColumn === 'brand') {
                              setHardwareSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setHardwareSortColumn('brand');
                              setHardwareSortDirection('asc');
                            }
                          }}
                        >
                          Marca/Modelo {hardwareSortColumn === 'brand' && (hardwareSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="px-6 py-4 text-left text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            if (hardwareSortColumn === 'price') {
                              setHardwareSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                            } else {
                              setHardwareSortColumn('price');
                              setHardwareSortDirection('asc');
                            }
                          }}
                        >
                          Preço {hardwareSortColumn === 'price' && (hardwareSortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {hardwareList
                        .filter((item) => {
                          // Text search filter
                          if (hardwareSearchTerm) {
                            const search = hardwareSearchTerm.toLowerCase();
                            const matchesSearch = 
                              item.name.toLowerCase().includes(search) ||
                              item.brand.toLowerCase().includes(search) ||
                              item.model.toLowerCase().includes(search);
                            if (!matchesSearch) return false;
                          }
                          // Category-specific filters
                          for (const [field, value] of Object.entries(activeHardwareFilter)) {
                            if (!value) continue;
                            const itemValue = (item as any)[field];
                            if (!itemValue) return false;
                            // Handle TDP filtering specially
                            if (field === 'tdp' && typeof itemValue === 'number') {
                              const tdpThreshold = parseInt(value);
                              if (value.includes('+')) {
                                if (itemValue < tdpThreshold) return false;
                              } else if (itemValue < tdpThreshold - 100 || itemValue > tdpThreshold) {
                                return false;
                              }
                            } else if (String(itemValue).toLowerCase() !== value.toLowerCase()) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .sort((a, b) => {
                          const direction = hardwareSortDirection === 'asc' ? 1 : -1;
                          if (hardwareSortColumn === 'name') {
                            return a.name.localeCompare(b.name) * direction;
                          } else if (hardwareSortColumn === 'brand') {
                            const brandA = `${a.brand} ${a.model}`;
                            const brandB = `${b.brand} ${b.model}`;
                            return brandA.localeCompare(brandB) * direction;
                          } else {
                            return ((a.price || 0) - (b.price || 0)) * direction;
                          }
                        })
                        .map((item) => (
                        <tr key={item.id} className={`hover:bg-secondary/50 ${selectedHardware.has(item.id) ? 'bg-primary/10' : ''}`}>
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedHardware.has(item.id)}
                              onChange={() => toggleHardwareSelection(item.id)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <ActiveHardwareIcon className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 font-medium text-foreground">{item.name}</td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {item.brand} {item.model}
                          </td>
                          <td className="px-4 py-4 font-semibold text-primary">{formatPrice(item.price)}</td>
                          <td className="px-4 py-4">
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
                          <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
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
                    const isCustomType = customCategoriesList.some(c => c.key === type.key);
                    const isSelected = productFormData.productType === type.key;
                    return (
                      <div key={type.key} className="relative group">
                        <button
                          type="button"
                          onClick={() => setProductFormData(prev => ({ ...prev, productType: type.key }))}
                          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-foreground hover:bg-secondary/80"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </button>
                        {/* Delete button for custom types */}
                        {isCustomType && !isSelected && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Excluir tipo "${type.label}"?`)) {
                                await removeCustomCategory(type.key);
                                const updatedCategories = await getCustomCategories();
                                setCustomCategoriesList(updatedCategories);
                                toast({ title: "Tipo removido" });
                              }
                            }}
                            className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs hover:bg-destructive/80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
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
                      onClick={async () => {
                        if (inlineNewCategoryKey && inlineNewCategoryLabel) {
                          await addCustomCategory(inlineNewCategoryKey, inlineNewCategoryLabel, inlineNewCategoryIcon);
                          const updatedCategories = await getCustomCategories();
                          setCustomCategoriesList(updatedCategories);
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
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={productFormData.title}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Nome do produto"
                    />
                    <button
                      type="button"
                      onClick={generateProductInfoWithAI}
                      disabled={isGeneratingAI || !productFormData.title}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Gerar descrição e specs com IA"
                    >
                      {isGeneratingAI ? (
                        <Sparkles className="h-5 w-5 animate-spin" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                      <span className="hidden sm:inline">IA</span>
                    </button>
                  </div>
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

              {/* Description - Free Text Field */}
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Descrição</label>
                <textarea
                  value={productFormData.description}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
                  placeholder="Descrição detalhada do produto (texto livre)..."
                />
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
                  
                  {/* Download URL for automações and fluxos_n8n */}
                  {(productFormData.productType === 'automacao' || productFormData.productType === 'fluxos_n8n') && (
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
                                <TooltipProvider key={step.key}>
                                  <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                      <div
                                        onClick={() => selectComponent(step.key, undefined)}
                                        className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-destructive hover:bg-destructive/10"
                                      >
                                        <div className="flex items-center gap-3">
                                          {/* Thumbnail */}
                                          <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                                            {selected.image ? (
                                              <img 
                                                src={selected.image} 
                                                alt={selected.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <Icon className="h-5 w-5 text-primary" />
                                            )}
                                          </div>
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
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="w-48 p-2 bg-popover">
                                      {selected.image ? (
                                        <img 
                                          src={selected.image} 
                                          alt={`${selected.brand} ${selected.model}`}
                                          className="w-full h-32 object-contain rounded-lg bg-muted"
                                        />
                                      ) : (
                                        <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                                          <Package className="h-12 w-12 text-muted-foreground" />
                                        </div>
                                      )}
                                      <p className="font-semibold text-sm mt-2 text-center">{selected.brand} {selected.model}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
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
                              <TooltipProvider key={item.id}>
                                <Tooltip delayDuration={100}>
                                  <TooltipTrigger asChild>
                                    <div
                                      onClick={() => selectComponent(currentStep.key, item)}
                                      className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background p-4 transition-all hover:border-primary hover:bg-primary/5"
                                    >
                                      <div className="flex items-center gap-4">
                                        {/* Thumbnail */}
                                        <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                                          {item.image ? (
                                            <img 
                                              src={item.image} 
                                              alt={item.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground">
                                              {idx + 1}
                                            </span>
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-foreground">{item.name}</p>
                                          <p className="text-sm text-muted-foreground">{item.brand} {item.model}</p>
                                        </div>
                                      </div>
                                      <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="w-48 p-2 bg-popover">
                                    {item.image ? (
                                      <img 
                                        src={item.image} 
                                        alt={`${item.brand} ${item.model}`}
                                        className="w-full h-32 object-contain rounded-lg bg-muted"
                                      />
                                    ) : (
                                      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                                        <Package className="h-12 w-12 text-muted-foreground" />
                                      </div>
                                    )}
                                    <p className="font-semibold text-sm mt-2 text-center">{item.brand} {item.model}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                                  <TooltipProvider key={step.key}>
                                    <Tooltip delayDuration={100}>
                                      <TooltipTrigger asChild>
                                        <div
                                          onClick={() => selectComponent(step.key, undefined)}
                                          className="flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm transition-colors hover:bg-destructive/20"
                                        >
                                          {/* Mini Thumbnail */}
                                          <div className="w-6 h-6 rounded bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                                            {selected.image ? (
                                              <img 
                                                src={selected.image} 
                                                alt={selected.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <StepIcon className="h-4 w-4 text-primary" />
                                            )}
                                          </div>
                                          <span className="text-foreground">{selected.brand} {selected.model}</span>
                                          <span className="text-primary">{formatPrice(selected.price)}</span>
                                          <X className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="w-48 p-2 bg-popover">
                                        {selected.image ? (
                                          <img 
                                            src={selected.image} 
                                            alt={`${selected.brand} ${selected.model}`}
                                            className="w-full h-32 object-contain rounded-lg bg-muted"
                                          />
                                        ) : (
                                          <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                                            <Package className="h-12 w-12 text-muted-foreground" />
                                          </div>
                                        )}
                                        <p className="font-semibold text-sm mt-2 text-center">{selected.brand} {selected.model}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
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

              {/* Extra Products for PC/Kit - Add products from other categories */}
              {(productFormData.productType === 'pc' || productFormData.productType === 'kit') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Produtos Extras (Opcional)</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione uma categoria e adicione produtos para compor este {productFormData.productType === 'pc' ? 'PC montado' : 'Kit'}
                  </p>
                  
                  {/* Category Selection */}
                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="mb-3 text-sm font-medium text-foreground">Selecione a categoria:</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {productTypes
                        .filter(t => t.key !== 'pc' && t.key !== 'kit')
                        .map((type) => {
                          const Icon = type.icon;
                          const productCount = products.filter(p => p.productType === type.key).length;
                          return (
                            <button
                              key={type.key}
                              type="button"
                              onClick={() => setExtraProductCategory(extraProductCategory === type.key ? null : type.key)}
                              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                extraProductCategory === type.key
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-foreground hover:bg-secondary/80"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {type.label}
                              {productCount > 0 && (
                                <span className="ml-1 rounded-full bg-background/20 px-1.5 py-0.5 text-xs">
                                  {productCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    
                    {/* Products from selected category */}
                    {extraProductCategory && (
                      <div className="border-t border-border pt-4">
                        <p className="mb-3 text-sm font-medium text-foreground">
                          Produtos em {productTypes.find(t => t.key === extraProductCategory)?.label || extraProductCategory}:
                        </p>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {products
                            .filter(p => p.productType === extraProductCategory)
                            .sort((a, b) => a.totalPrice - b.totalPrice)
                            .map(product => {
                              const isAdded = productFormData.extraProducts.some(ep => ep.id === product.id);
                              return (
                                <div
                                  key={product.id}
                                  onClick={() => {
                                    if (!isAdded) {
                                      setProductFormData(prev => ({
                                        ...prev,
                                        extraProducts: [...prev.extraProducts, {
                                          id: product.id,
                                          title: product.title,
                                          price: product.totalPrice,
                                          category: product.productType || ''
                                        }],
                                        totalPrice: prev.totalPrice + product.totalPrice
                                      }));
                                    }
                                  }}
                                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                                    isAdded 
                                      ? 'border-primary bg-primary/10' 
                                      : 'border-border hover:border-primary hover:bg-primary/5'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {product.media?.[0]?.url && (
                                      <img src={product.media[0].url} alt="" className="h-10 w-10 rounded object-cover" />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{product.title}</p>
                                      <p className="text-xs text-muted-foreground">{product.subtitle}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-primary">{formatPrice(product.totalPrice)}</span>
                                    {isAdded ? (
                                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">✓ Adicionado</span>
                                    ) : (
                                      <Plus className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          {products.filter(p => p.productType === extraProductCategory).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum produto nesta categoria
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Selected extra products */}
                  {productFormData.extraProducts.length > 0 && (
                    <div className="rounded-xl border border-primary bg-primary/5 p-4">
                      <h4 className="mb-3 font-medium text-foreground">Produtos Adicionados ({productFormData.extraProducts.length}):</h4>
                      <div className="space-y-2">
                        {productFormData.extraProducts.map((extra, index) => (
                          <div
                            key={`${extra.id}-${index}`}
                            className="flex items-center justify-between rounded-lg bg-card border border-border p-3"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">{extra.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {productTypes.find(t => t.key === extra.category)?.label || extra.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-primary">{formatPrice(extra.price)}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setProductFormData(prev => ({
                                    ...prev,
                                    extraProducts: prev.extraProducts.filter((_, i) => i !== index),
                                    totalPrice: prev.totalPrice - extra.price
                                  }));
                                }}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

              {/* Specs / Informações do Produto */}
              <div className="rounded-xl border border-border bg-card/50 p-4">
                <label className="mb-3 block text-lg font-semibold text-foreground">
                  📋 Informações do Produto
                </label>
                <p className="mb-4 text-sm text-muted-foreground">
                  Adicione informações que aparecerão na página do produto (ex: Garantia, Peso, Dimensões, Cor, etc.)
                </p>
                
                {Object.entries(productFormData.specs).length > 0 && (
                  <div className="mb-4 space-y-2">
                    {Object.entries(productFormData.specs).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3">
                        <span className="text-foreground">
                          <strong className="text-primary">{key}:</strong> {value}
                        </span>
                        <button type="button" onClick={() => removeProductSpec(key)} className="text-destructive hover:text-destructive/80">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProductSpecKey}
                    onChange={(e) => setNewProductSpecKey(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Nome (ex: Garantia)"
                  />
                  <input
                    type="text"
                    value={newProductSpecValue}
                    onChange={(e) => setNewProductSpecValue(e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                    placeholder="Valor (ex: 12 meses)"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addProductSpec())}
                  />
                  <button
                    type="button"
                    onClick={addProductSpec}
                    className="rounded-lg bg-primary px-4 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
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
                  {hardwareCategoriesList.map(cat => (
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

      {/* New Hardware Category Modal */}
      {showNewHardwareCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Subcategoria de Hardware</h3>
              <button onClick={() => setShowNewHardwareCategoryModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Chave (ID único)</label>
                <input
                  type="text"
                  value={newHardwareCatKey}
                  onChange={(e) => setNewHardwareCatKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  placeholder="ex: placa_rede"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={newHardwareCatLabel}
                  onChange={(e) => setNewHardwareCatLabel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  placeholder="Ex: Placas de Rede"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ícone</label>
                <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 border border-border rounded-lg bg-background">
                  {availableIcons.slice(0, 40).map((iconOption) => {
                    const IconComp = iconOption.icon;
                    return (
                      <button
                        key={iconOption.key}
                        type="button"
                        onClick={() => setNewHardwareCatIcon(iconOption.key)}
                        className={`p-2 rounded-lg transition-colors ${
                          newHardwareCatIcon === iconOption.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        <IconComp className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Filtros (opcional)</label>
                <p className="text-xs text-muted-foreground mb-2">Adicione campos para filtrar produtos desta categoria</p>
                
                {newHardwareCatFilters.map((filter, idx) => (
                  <div key={idx} className="mb-2 p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{filter.label}</span>
                      <button
                        type="button"
                        onClick={() => setNewHardwareCatFilters(prev => prev.filter((_, i) => i !== idx))}
                        className="text-destructive text-xs"
                      >
                        Remover
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {filter.options.map((opt, optIdx) => (
                        <span key={optIdx} className="px-2 py-1 bg-background rounded text-xs">{opt}</span>
                      ))}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    const field = prompt('Nome do campo (ex: memoryType, socket):');
                    const label = prompt('Label exibido (ex: Tipo de Memória):');
                    const options = prompt('Opções separadas por vírgula (ex: DDR3, DDR4, DDR5):');
                    if (field && label && options) {
                      setNewHardwareCatFilters(prev => [...prev, {
                        field,
                        label,
                        options: options.split(',').map(o => o.trim())
                      }]);
                    }
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  + Adicionar filtro
                </button>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={async () => {
                    if (!newHardwareCatKey || !newHardwareCatLabel) {
                      toast({ title: "Erro", description: "Preencha chave e nome", variant: "destructive" });
                      return;
                    }
                    const success = await addHardwareCategory({
                      key: newHardwareCatKey,
                      label: newHardwareCatLabel,
                      icon: newHardwareCatIcon,
                      filters: newHardwareCatFilters.length > 0 ? newHardwareCatFilters : undefined
                    });
                    if (success) {
                      const updated = await getHardwareCategories();
                      const merged = [...defaultHardwareCategories];
                      updated.forEach(dbCat => {
                        const idx = merged.findIndex(c => c.key === dbCat.key);
                        if (idx >= 0) merged[idx] = dbCat;
                        else merged.push(dbCat);
                      });
                      setHardwareCategoriesList(merged);
                      setShowNewHardwareCategoryModal(false);
                      toast({ title: "Categoria criada" });
                    } else {
                      toast({ title: "Erro ao criar categoria", variant: "destructive" });
                    }
                  }}
                  className="flex-1 rounded-lg bg-primary py-2 font-semibold text-primary-foreground"
                >
                  Criar
                </button>
                <button
                  onClick={() => setShowNewHardwareCategoryModal(false)}
                  className="flex-1 rounded-lg border border-border py-2 font-semibold text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Hardware Category Modal */}
      {showEditHardwareCategoryModal && editingHardwareCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar Subcategoria: {editingHardwareCategory.label}</h3>
              <button onClick={() => setShowEditHardwareCategoryModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={newHardwareCatLabel}
                  onChange={(e) => setNewHardwareCatLabel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Ícone</label>
                <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 border border-border rounded-lg bg-background">
                  {availableIcons.slice(0, 40).map((iconOption) => {
                    const IconComp = iconOption.icon;
                    return (
                      <button
                        key={iconOption.key}
                        type="button"
                        onClick={() => setNewHardwareCatIcon(iconOption.key)}
                        className={`p-2 rounded-lg transition-colors ${
                          newHardwareCatIcon === iconOption.key
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        }`}
                      >
                        <IconComp className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Filtros</label>
                
                {newHardwareCatFilters.map((filter, idx) => (
                  <div key={idx} className="mb-2 p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{filter.label} ({filter.field})</span>
                      <button
                        type="button"
                        onClick={() => setNewHardwareCatFilters(prev => prev.filter((_, i) => i !== idx))}
                        className="text-destructive text-xs"
                      >
                        Remover
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {filter.options.map((opt, optIdx) => (
                        <span key={optIdx} className="px-2 py-1 bg-background rounded text-xs">{opt}</span>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newOpt = prompt('Nova opção:');
                          if (newOpt) {
                            setNewHardwareCatFilters(prev => prev.map((f, i) => 
                              i === idx ? { ...f, options: [...f.options, newOpt.trim()] } : f
                            ));
                          }
                        }}
                        className="px-2 py-1 bg-primary/20 text-primary rounded text-xs"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    const field = prompt('Nome do campo (ex: memoryType, socket):');
                    const label = prompt('Label exibido (ex: Tipo de Memória):');
                    const options = prompt('Opções separadas por vírgula (ex: DDR3, DDR4, DDR5):');
                    if (field && label && options) {
                      setNewHardwareCatFilters(prev => [...prev, {
                        field,
                        label,
                        options: options.split(',').map(o => o.trim())
                      }]);
                    }
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  + Adicionar novo filtro
                </button>
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={async () => {
                    const success = await updateHardwareCategory(editingHardwareCategory.key, {
                      label: newHardwareCatLabel,
                      icon: newHardwareCatIcon,
                      filters: newHardwareCatFilters.length > 0 ? newHardwareCatFilters : undefined
                    });
                    if (success) {
                      const updated = await getHardwareCategories();
                      const merged = [...defaultHardwareCategories];
                      updated.forEach(dbCat => {
                        const idx = merged.findIndex(c => c.key === dbCat.key);
                        if (idx >= 0) merged[idx] = dbCat;
                        else merged.push(dbCat);
                      });
                      setHardwareCategoriesList(merged);
                      setShowEditHardwareCategoryModal(false);
                      toast({ title: "Categoria atualizada" });
                    } else {
                      toast({ title: "Erro ao atualizar", variant: "destructive" });
                    }
                  }}
                  className="flex-1 rounded-lg bg-primary py-2 font-semibold text-primary-foreground"
                >
                  Salvar
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`Excluir a categoria "${editingHardwareCategory.label}"?`)) {
                      await removeHardwareCategory(editingHardwareCategory.key);
                      const updated = await getHardwareCategories();
                      const merged = [...defaultHardwareCategories];
                      updated.forEach(dbCat => {
                        const idx = merged.findIndex(c => c.key === dbCat.key);
                        if (idx >= 0) merged[idx] = dbCat;
                        else merged.push(dbCat);
                      });
                      setHardwareCategoriesList(merged);
                      setShowEditHardwareCategoryModal(false);
                      setActiveHardwareCategory('processor');
                      toast({ title: "Categoria removida" });
                    }
                  }}
                  className="rounded-lg bg-destructive/20 px-4 py-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowEditHardwareCategoryModal(false)}
                  className="flex-1 rounded-lg border border-border py-2 font-semibold text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Products Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-card max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Editar {selectedProducts.size} Produto(s)</h3>
              <button
                onClick={() => {
                  setShowBulkEditModal(false);
                  setBulkEditType("");
                  setBulkEditCategory("");
                  setBulkEditCategoryAction('add');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Show current categories of selected products */}
            <div className="mb-6 p-4 rounded-lg bg-secondary/50">
              <p className="text-sm font-medium text-foreground mb-2">Categorias atuais dos produtos selecionados:</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const allCategories = new Set<string>();
                  selectedProducts.forEach(id => {
                    const product = products.find(p => p.id === id);
                    if (product?.productType) allCategories.add(product.productType);
                    product?.categories?.forEach(c => allCategories.add(c));
                  });
                  const categoriesArray = Array.from(allCategories);
                  if (categoriesArray.length === 0) {
                    return <span className="text-sm text-muted-foreground">Nenhuma categoria</span>;
                  }
                  return categoriesArray.map(cat => {
                    const catInfo = customCategoriesList.find(c => c.key === cat) || productTypes.find(t => t.key === cat);
                    return (
                      <span key={cat} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary">
                        {catInfo?.label || cat}
                      </span>
                    );
                  });
                })()}
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Bulk Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Alterar Tipo de Produto
                </label>
                <select
                  value={bulkEditType}
                  onChange={(e) => setBulkEditType(e.target.value as ProductCategory | "")}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Manter tipo atual</option>
                  {productTypes.map((type) => (
                    <option key={type.key} value={type.key}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Category Action Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Ação de Categoria
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkEditCategoryAction('add')}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      bulkEditCategoryAction === 'add' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkEditCategoryAction('replace')}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      bulkEditCategoryAction === 'replace' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Substituir
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkEditCategoryAction('remove')}
                    className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      bulkEditCategoryAction === 'remove' 
                        ? 'bg-destructive text-destructive-foreground' 
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                    }`}
                  >
                    Remover
                  </button>
                </div>
              </div>
              
              {/* Bulk Category Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  {bulkEditCategoryAction === 'add' && 'Adicionar à Categoria'}
                  {bulkEditCategoryAction === 'replace' && 'Substituir por Categoria'}
                  {bulkEditCategoryAction === 'remove' && 'Remover da Categoria'}
                </label>
                <select
                  value={bulkEditCategory}
                  onChange={(e) => setBulkEditCategory(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Selecione uma categoria</option>
                  {bulkEditCategoryAction === 'remove' ? (
                    // For remove action, show categories from selected products (including orphaned ones)
                    (() => {
                      const allCategories = new Set<string>();
                      selectedProducts.forEach(id => {
                        const product = products.find(p => p.id === id);
                        if (product?.productType) allCategories.add(product.productType);
                        product?.categories?.forEach(c => allCategories.add(c));
                      });
                      return Array.from(allCategories).map(cat => {
                        const catInfo = customCategoriesList.find(c => c.key === cat) || productTypes.find(t => t.key === cat);
                        return (
                          <option key={cat} value={cat}>
                            {catInfo?.label || cat} {!catInfo && '(não existe mais)'}
                          </option>
                        );
                      });
                    })()
                  ) : (
                    // For add/replace, show all available categories
                    customCategoriesList.map((cat) => (
                      <option key={cat.key} value={cat.key}>{cat.label}</option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bulkEditCategoryAction === 'add' && 'A categoria será adicionada às categorias existentes'}
                  {bulkEditCategoryAction === 'replace' && 'Todas as categorias serão substituídas pela selecionada'}
                  {bulkEditCategoryAction === 'remove' && 'A categoria selecionada será removida dos produtos'}
                </p>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleBulkEditProducts}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Save className="h-5 w-5" />
                  Aplicar Alterações
                </button>
                <button
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditType("");
                    setBulkEditCategory("");
                    setBulkEditCategoryAction('add');
                  }}
                  className="flex-1 rounded-lg border border-border py-3 font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Category Classifier Modal */}
      {showAIClassifier && (
        <AICategoryClassifier
          selectedProducts={products.filter(p => selectedProducts.has(p.id))}
          onClose={() => setShowAIClassifier(false)}
          onApply={async (classifications) => {
            // Apply classifications to products
            for (const classification of classifications) {
              const product = products.find(p => p.id === classification.id);
              if (product) {
                await api.updateProduct(product.id, {
                  ...product,
                  categories: classification.categories,
                  productType: classification.productType
                });
              }
            }
            // Refresh products
            const updatedProducts = await api.getProducts();
            setProducts(updatedProducts);
            setSelectedProducts(new Set());
            toast({ title: "Classificação aplicada com sucesso!" });
          }}
        />
      )}

      <RedWhiteFooter />
    </div>
  );
}
