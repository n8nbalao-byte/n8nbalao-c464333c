import { 
  Tag, Gamepad2, Headphones, Keyboard, Mouse, Printer, Wifi, Camera, Speaker, 
  Smartphone, Watch, ShoppingBag, Gift, Star, Heart, Award, Crown, Shield, 
  Rocket, Sparkles, Flame, Leaf, Sun, Moon, Cloud, Umbrella, Anchor, Compass, 
  Map, Globe, Flag, Bookmark, Briefcase, Clock, Calendar, Bell, Mail, 
  MessageSquare, Phone, Video, Music, Film, BookOpen, FileText, Folder, 
  Database, Server, Terminal, Settings, Wrench, Hammer, PenTool, Scissors, 
  Paintbrush, Palette, Monitor, Laptop, Cpu, Box, Package, LucideIcon,
  Joystick, Tv, Key, Code, Bot, Armchair, Zap, HardDrive, MemoryStick, CircuitBoard, Droplets,
  Gamepad, MonitorPlay, Disc, Disc3, Radio, Cable, Usb, Power, Bluetooth, 
  Router, Airplay, Cast, ScreenShare, PcCase, Component, Microchip, Binary, 
  Glasses, Eye, Target, Crosshair, Swords, Trophy, Medal, Dumbbell,
  // Additional icons
  Home, Building, Building2, Store, Factory, Warehouse, Hotel, Church, School,
  Car, Bike, Bus, Train, Plane, Ship, Truck,
  Coffee, Pizza, Apple, Banana, Cherry, Grape, IceCream2, Cake, Cookie, Croissant,
  Dog, Cat, Bird, Fish, Bug, Rabbit, Squirrel,
  Trees, Flower, Flower2, Mountain, Waves, Wind, Snowflake, CloudRain, CloudSun,
  Lightbulb, Lamp, LampDesk, Flashlight, Plug, PlugZap, Battery, BatteryCharging,
  Lock, Unlock, KeyRound, Fingerprint, Scan, QrCode, Barcode,
  CreditCard, Wallet, Coins, Banknote, PiggyBank, Receipt, Calculator,
  ShoppingCart, Tag as TagIcon, Percent, BadgePercent, BadgeDollarSign,
  Users, User, UserCircle, UserCheck, UserPlus, UserMinus, UserX, 
  Baby, PersonStanding, Accessibility, HeartHandshake,
  Megaphone, BadgeInfo, AlertCircle, AlertTriangle, Info, HelpCircle, CircleCheck, CircleX,
  ThumbsUp, ThumbsDown, Hand, HandMetal, Pointer, Move, 
  Download, Upload, Share, Share2, Send, Forward, Reply,
  Play, Pause, Square, Circle, Triangle, Hexagon, Pentagon, Octagon, Diamond,
  Minimize, Maximize, Expand, Shrink, ZoomIn, ZoomOut,
  RotateCw, RotateCcw, RefreshCw, RefreshCcw, Repeat, Shuffle, SkipBack, SkipForward,
  Volume, Volume1, Volume2, VolumeX, Mic, MicOff,
  Image, Images, ImagePlus, GalleryHorizontal, LayoutGrid, LayoutList, Grid3X3,
  Table, Table2, Columns, Rows, PanelLeft, PanelRight, SidebarOpen, SidebarClose,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronsUp, ChevronsDown, ChevronUp, ChevronDown,
  Plus, Minus, X, Check, Equal, Divide, Hash,
  Search, Filter, SortAsc, SortDesc, ListOrdered, List, CheckSquare, CheckCircle,
  Link, Link2, ExternalLink, Paperclip, Pin, PinOff,
  Edit, Edit2, Edit3, Eraser, Copy, Clipboard, ClipboardCheck,
  Trash, Trash2, Archive, ArchiveRestore,
  Eye as EyeIcon, EyeOff, Focus, Scan as ScanIcon, Aperture,
  Activity, Gauge, BarChart, BarChart2, BarChart3, LineChart, PieChart, TrendingUp, TrendingDown,
  Thermometer, ThermometerSun, ThermometerSnowflake, Droplet, CloudDrizzle, CloudFog,
  Bone, Skull, Ghost, SmilePlus, Smile, Meh, Frown, Angry, Annoyed,
  Crown as CrownIcon, Gem, Wand, Wand2, Sparkle, Stars, Sunrise, Sunset, 
  Tent, Backpack, Luggage, Ticket, MapPin, Navigation, Locate, LocateFixed,
  Newspaper, NotebookPen, BookMarked, LibraryBig, GraduationCap, PencilRuler,
  Microscope, FlaskConical, FlaskRound, TestTube, TestTubes, Atom, Dna,
  Stethoscope, Pill, Syringe, Bandage, HeartPulse, Hospital, Ambulance,
  Dumbbell as DumbbellIcon, Footprints, PersonStanding as PersonIcon, Utensils, UtensilsCrossed, ChefHat,
  Sofa, Bed, Bath, Refrigerator, WashingMachine, AirVent, Fan,
  Lightbulb as LightbulbIcon, CandlestickChart, Flashlight as FlashlightIcon, Projector,
  Guitar, Drum, Mic2, Podcast, Headset,
  Shirt, Glasses as GlassesIcon, Watch as WatchIcon,
  Puzzle, Dices, Spade, Club, Heart as HeartIcon, Diamond as DiamondIcon,
  Construction, HardHat, Cone, Shovel, Axe, Pickaxe,
  Tractor, TreePine, Fence, Wheat, Salad, Carrot, Egg,
  Wine, Beer, Martini, CupSoda, GlassWater, Milk,
  Candy, Popcorn, Sandwich, Soup, Beef, Drumstick,
  Clapperboard, Drama, Ticket as TicketIcon,
  PaintBucket, Pipette, Ruler, Shapes, Pentagon as PentagonIcon, Asterisk,
  FileCode, FileJson, FileSpreadsheet, FileArchive, FileAudio, FileVideo, FileImage,
  FolderOpen, FolderPlus, FolderMinus, FolderCheck, FolderX, FolderHeart,
  HardDrive as HDIcon, Save, ServerCog, ServerCrash, Cog,
  Network, Workflow, GitBranch, GitMerge, GitCommit, GitPullRequest,
  Container, Layers, Layers2, Layers3, SquareStack,
  Webhook, Blocks, Boxes, Component as ComponentIcon,
  SmartphoneCharging, TabletSmartphone, MonitorSmartphone, Laptop2, LaptopMinimal,
  ScreenShare as ScreenIcon, Presentation, GalleryVertical, SplitSquareVertical,
  AppWindow, PanelTop, PanelBottom, LayoutDashboard, LayoutTemplate,
  MonitorDot, MonitorCheck, MonitorX, MonitorSpeaker, MonitorPlay as MonitorPlayIcon
} from "lucide-react";

// Mapping of icon keys to Lucide icon components
export const iconMap: Record<string, LucideIcon> = {
  'tag': Tag,
  'gamepad2': Gamepad2,
  'gamepad': Gamepad,
  'joystick': Joystick,
  'monitor-play': MonitorPlay,
  'disc': Disc,
  'disc3': Disc3,
  'headphones': Headphones,
  'keyboard': Keyboard,
  'mouse': Mouse,
  'printer': Printer,
  'wifi': Wifi,
  'bluetooth': Bluetooth,
  'router': Router,
  'cable': Cable,
  'usb': Usb,
  'power': Power,
  'camera': Camera,
  'speaker': Speaker,
  'radio': Radio,
  'smartphone': Smartphone,
  'watch': Watch,
  'shopping-bag': ShoppingBag,
  'gift': Gift,
  'star': Star,
  'heart': Heart,
  'award': Award,
  'crown': Crown,
  'shield': Shield,
  'rocket': Rocket,
  'sparkles': Sparkles,
  'flame': Flame,
  'leaf': Leaf,
  'sun': Sun,
  'moon': Moon,
  'cloud': Cloud,
  'umbrella': Umbrella,
  'anchor': Anchor,
  'compass': Compass,
  'map': Map,
  'globe': Globe,
  'flag': Flag,
  'bookmark': Bookmark,
  'briefcase': Briefcase,
  'clock': Clock,
  'calendar': Calendar,
  'bell': Bell,
  'mail': Mail,
  'message-square': MessageSquare,
  'phone': Phone,
  'video': Video,
  'music': Music,
  'film': Film,
  'book-open': BookOpen,
  'file-text': FileText,
  'folder': Folder,
  'database': Database,
  'server': Server,
  'terminal': Terminal,
  'settings': Settings,
  'wrench': Wrench,
  'hammer': Hammer,
  'pen-tool': PenTool,
  'scissors': Scissors,
  'paintbrush': Paintbrush,
  'palette': Palette,
  'monitor': Monitor,
  'laptop': Laptop,
  'cpu': Cpu,
  'box': Box,
  'package': Package,
  'tv': Tv,
  'key': Key,
  'code': Code,
  'bot': Bot,
  'armchair': Armchair,
  'zap': Zap,
  'hard-drive': HardDrive,
  'memory-stick': MemoryStick,
  'circuit-board': CircuitBoard,
  'droplets': Droplets,
  'airplay': Airplay,
  'cast': Cast,
  'screen-share': ScreenShare,
  'pc-case': PcCase,
  'component': Component,
  'microchip': Microchip,
  'binary': Binary,
  'glasses': Glasses,
  'eye': Eye,
  'target': Target,
  'crosshair': Crosshair,
  'swords': Swords,
  'trophy': Trophy,
  'medal': Medal,
  'dumbbell': Dumbbell,
  // Home & Buildings
  'home': Home,
  'building': Building,
  'building2': Building2,
  'store': Store,
  'factory': Factory,
  'warehouse': Warehouse,
  'hotel': Hotel,
  'church': Church,
  'school': School,
  // Transport
  'car': Car,
  'bike': Bike,
  'bus': Bus,
  'train': Train,
  'plane': Plane,
  'ship': Ship,
  'truck': Truck,
  // Food
  'coffee': Coffee,
  'pizza': Pizza,
  'apple': Apple,
  'banana': Banana,
  'cherry': Cherry,
  'grape': Grape,
  'ice-cream': IceCream2,
  'cake': Cake,
  'cookie': Cookie,
  'croissant': Croissant,
  'wine': Wine,
  'beer': Beer,
  'martini': Martini,
  'cup-soda': CupSoda,
  'glass-water': GlassWater,
  'milk': Milk,
  'popcorn': Popcorn,
  'sandwich': Sandwich,
  'soup': Soup,
  'beef': Beef,
  'drumstick': Drumstick,
  'candy': Candy,
  'utensils': Utensils,
  'utensils-crossed': UtensilsCrossed,
  'chef-hat': ChefHat,
  // Animals
  'dog': Dog,
  'cat': Cat,
  'bird': Bird,
  'fish': Fish,
  'bug': Bug,
  'rabbit': Rabbit,
  'squirrel': Squirrel,
  // Nature
  'tree': Trees,
  'tree-pine': TreePine,
  'flower': Flower,
  'flower2': Flower2,
  'mountain': Mountain,
  'waves': Waves,
  'wind': Wind,
  'snowflake': Snowflake,
  'cloud-rain': CloudRain,
  'cloud-sun': CloudSun,
  'sunrise': Sunrise,
  'sunset': Sunset,
  // Light & Power
  'lightbulb': Lightbulb,
  'lamp': Lamp,
  'lamp-desk': LampDesk,
  'flashlight': Flashlight,
  'plug': Plug,
  'plug-zap': PlugZap,
  'battery': Battery,
  'battery-charging': BatteryCharging,
  // Security
  'lock': Lock,
  'unlock': Unlock,
  'key-round': KeyRound,
  'fingerprint': Fingerprint,
  'scan': Scan,
  'qr-code': QrCode,
  'barcode': Barcode,
  // Finance
  'credit-card': CreditCard,
  'wallet': Wallet,
  'coins': Coins,
  'banknote': Banknote,
  'piggy-bank': PiggyBank,
  'receipt': Receipt,
  'calculator': Calculator,
  'percent': Percent,
  'badge-percent': BadgePercent,
  'badge-dollar': BadgeDollarSign,
  // Shopping
  'shopping-cart': ShoppingCart,
  // People
  'users': Users,
  'user': User,
  'user-circle': UserCircle,
  'user-check': UserCheck,
  'user-plus': UserPlus,
  'baby': Baby,
  'person-standing': PersonStanding,
  'accessibility': Accessibility,
  'heart-handshake': HeartHandshake,
  // Alerts
  'megaphone': Megaphone,
  'badge-info': BadgeInfo,
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'info': Info,
  'help-circle': HelpCircle,
  'circle-check': CircleCheck,
  'circle-x': CircleX,
  // Gestures
  'thumbs-up': ThumbsUp,
  'thumbs-down': ThumbsDown,
  'hand': Hand,
  'hand-metal': HandMetal,
  'pointer': Pointer,
  // Shapes
  'play': Play,
  'pause': Pause,
  'square': Square,
  'circle': Circle,
  'triangle': Triangle,
  'hexagon': Hexagon,
  'pentagon': Pentagon,
  'octagon': Octagon,
  'diamond': Diamond,
  // Audio
  'volume': Volume,
  'volume-1': Volume1,
  'volume-2': Volume2,
  'volume-x': VolumeX,
  'mic': Mic,
  'mic-off': MicOff,
  'headset': Headset,
  'podcast': Podcast,
  // Media
  'image': Image,
  'images': Images,
  'gallery-horizontal': GalleryHorizontal,
  'layout-grid': LayoutGrid,
  'layout-list': LayoutList,
  // Files
  'file-code': FileCode,
  'file-json': FileJson,
  'file-spreadsheet': FileSpreadsheet,
  'file-archive': FileArchive,
  'file-audio': FileAudio,
  'file-video': FileVideo,
  'file-image': FileImage,
  'folder-open': FolderOpen,
  'folder-plus': FolderPlus,
  // Charts
  'activity': Activity,
  'gauge': Gauge,
  'bar-chart': BarChart,
  'bar-chart-2': BarChart2,
  'bar-chart-3': BarChart3,
  'line-chart': LineChart,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  // Weather
  'thermometer': Thermometer,
  'thermometer-sun': ThermometerSun,
  'thermometer-snowflake': ThermometerSnowflake,
  'droplet': Droplet,
  'cloud-drizzle': CloudDrizzle,
  'cloud-fog': CloudFog,
  // Fun
  'ghost': Ghost,
  'smile': Smile,
  'meh': Meh,
  'frown': Frown,
  'skull': Skull,
  // Premium
  'gem': Gem,
  'wand': Wand,
  'wand2': Wand2,
  'sparkle': Sparkle,
  'stars': Stars,
  // Travel
  'tent': Tent,
  'backpack': Backpack,
  'luggage': Luggage,
  'ticket': Ticket,
  'map-pin': MapPin,
  'navigation': Navigation,
  'locate': Locate,
  // Education
  'newspaper': Newspaper,
  'notebook-pen': NotebookPen,
  'book-marked': BookMarked,
  'library-big': LibraryBig,
  'graduation-cap': GraduationCap,
  'pencil-ruler': PencilRuler,
  // Science
  'microscope': Microscope,
  'flask-conical': FlaskConical,
  'flask-round': FlaskRound,
  'test-tube': TestTube,
  'test-tubes': TestTubes,
  'atom': Atom,
  'dna': Dna,
  // Health
  'stethoscope': Stethoscope,
  'pill': Pill,
  'syringe': Syringe,
  'bandage': Bandage,
  'heart-pulse': HeartPulse,
  'hospital': Hospital,
  'ambulance': Ambulance,
  // Home furniture
  'sofa': Sofa,
  'bed': Bed,
  'bath': Bath,
  'refrigerator': Refrigerator,
  'washing-machine': WashingMachine,
  'air-vent': AirVent,
  'fan': Fan,
  'projector': Projector,
  // Music instruments
  'guitar': Guitar,
  'drum': Drum,
  'mic2': Mic2,
  // Fashion
  'shirt': Shirt,
  // Games
  'puzzle': Puzzle,
  'dices': Dices,
  'spade': Spade,
  'club': Club,
  // Construction
  'construction': Construction,
  'hard-hat': HardHat,
  'cone': Cone,
  'shovel': Shovel,
  'axe': Axe,
  'pickaxe': Pickaxe,
  // Agriculture
  'tractor': Tractor,
  'fence': Fence,
  'wheat': Wheat,
  'salad': Salad,
  'carrot': Carrot,
  'egg': Egg,
  // Entertainment
  'clapperboard': Clapperboard,
  'drama': Drama,
  // Design tools
  'paint-bucket': PaintBucket,
  'pipette': Pipette,
  'ruler': Ruler,
  'shapes': Shapes,
  'asterisk': Asterisk,
  // Dev & Tech
  'save': Save,
  'server-cog': ServerCog,
  'workflow': Workflow,
  'git-branch': GitBranch,
  'git-merge': GitMerge,
  'git-commit': GitCommit,
  'container': Container,
  'layers': Layers,
  'layers-2': Layers2,
  'layers-3': Layers3,
  'square-stack': SquareStack,
  'webhook': Webhook,
  'blocks': Blocks,
  'boxes': Boxes,
  'network': Network,
  // Devices
  'smartphone-charging': SmartphoneCharging,
  'tablet-smartphone': TabletSmartphone,
  'monitor-smartphone': MonitorSmartphone,
  'laptop2': Laptop2,
  'laptop-minimal': LaptopMinimal,
  'presentation': Presentation,
  'layout-dashboard': LayoutDashboard,
  'layout-template': LayoutTemplate,
  'monitor-dot': MonitorDot,
  'monitor-check': MonitorCheck,
  'monitor-speaker': MonitorSpeaker,
};

// Available icons as array for selection UI
export const availableIcons: { key: string; icon: LucideIcon }[] = Object.entries(iconMap).map(
  ([key, icon]) => ({ key, icon })
);

// Get icon component from key, defaults to Tag
export function getIconFromKey(iconKey?: string): LucideIcon {
  if (!iconKey) return Tag;
  return iconMap[iconKey] || Tag;
}

// Smart icon mapping based on category name keywords
export function getIconForCategoryName(categoryName: string): string {
  const name = categoryName.toLowerCase();
  
  // Games and consoles
  if (name.includes('console') || name.includes('nintendo') || name.includes('playstation') || name.includes('xbox')) return 'gamepad2';
  if (name.includes('gamer') || name.includes('gaming') || name.includes('game') || name.includes('jogo')) return 'joystick';
  if (name.includes('controle') || name.includes('controller')) return 'gamepad';
  
  // Computers
  if (name.includes('pc') || name.includes('computador') || name.includes('desktop')) return 'pc-case';
  if (name.includes('notebook') || name.includes('laptop')) return 'laptop';
  if (name.includes('monitor') || name.includes('tela')) return 'monitor';
  if (name.includes('tv') || name.includes('televisão') || name.includes('televisor')) return 'tv';
  
  // Hardware components
  if (name.includes('processor') || name.includes('processador') || name.includes('cpu')) return 'cpu';
  if (name.includes('placa') || name.includes('motherboard') || name.includes('mobo')) return 'circuit-board';
  if (name.includes('memória') || name.includes('memoria') || name.includes('ram')) return 'memory-stick';
  if (name.includes('armazenamento') || name.includes('storage') || name.includes('ssd') || name.includes('hd')) return 'hard-drive';
  if (name.includes('gpu') || name.includes('video') || name.includes('gráfica') || name.includes('grafica')) return 'microchip';
  if (name.includes('cooler') || name.includes('resfriamento') || name.includes('water')) return 'droplets';
  if (name.includes('fonte') || name.includes('psu') || name.includes('power')) return 'power';
  if (name.includes('gabinete') || name.includes('case')) return 'box';
  
  // Accessories
  if (name.includes('headset') || name.includes('fone') || name.includes('audio') || name.includes('áudio')) return 'headphones';
  if (name.includes('teclado') || name.includes('keyboard')) return 'keyboard';
  if (name.includes('mouse')) return 'mouse';
  if (name.includes('microfone') || name.includes('mic')) return 'radio';
  if (name.includes('webcam') || name.includes('camera') || name.includes('câmera')) return 'camera';
  if (name.includes('caixa de som') || name.includes('speaker') || name.includes('alto-falante')) return 'speaker';
  if (name.includes('cadeira') || name.includes('chair')) return 'armchair';
  if (name.includes('acessório') || name.includes('acessorio') || name.includes('accessory')) return 'shopping-bag';
  
  // Network
  if (name.includes('roteador') || name.includes('router') || name.includes('wifi') || name.includes('rede')) return 'router';
  if (name.includes('cabo') || name.includes('cable')) return 'cable';
  
  // Software and automation
  if (name.includes('software') || name.includes('programa') || name.includes('app')) return 'code';
  if (name.includes('automação') || name.includes('automacao') || name.includes('automation') || name.includes('bot')) return 'bot';
  if (name.includes('licença') || name.includes('licenca') || name.includes('license') || name.includes('key')) return 'key';
  
  // Mobile
  if (name.includes('smartphone') || name.includes('celular') || name.includes('phone')) return 'smartphone';
  if (name.includes('tablet')) return 'smartphone';
  if (name.includes('smartwatch') || name.includes('relógio') || name.includes('relogio')) return 'watch';
  
  // Peripherals
  if (name.includes('impressora') || name.includes('printer')) return 'printer';
  if (name.includes('usb') || name.includes('pendrive')) return 'usb';
  
  // Kit
  if (name.includes('kit') || name.includes('combo') || name.includes('bundle')) return 'package';
  
  // Default
  return 'box';
}
