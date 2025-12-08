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
  Glasses, Eye, Target, Crosshair, Swords, Trophy, Medal, Dumbbell
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
