import { Link } from "react-router-dom";
import { ShoppingCart, Search, Menu, Cpu, HardDrive, Monitor, Laptop, Bot } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import balaoLogo from "@/assets/balao-logo.png";

interface RedWhiteHeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hideCart?: boolean;
  hideNavigation?: boolean;
}

export function RedWhiteHeader({ searchValue, onSearchChange, hideCart, hideNavigation }: RedWhiteHeaderProps) {
  const { totalItems, setIsOpen } = useCart();

  return (
    <>
      {/* Top Bar */}
      <div style={{ backgroundColor: '#DC2626' }} className="text-white py-2 text-sm">
        <div className="container flex justify-between items-center">
          <span>Bem-vindo à Balão da Informática!</span>
          <div className="flex gap-4">
            <Link to="/cliente" className="hover:underline">Minha Conta</Link>
            <Link to="/meus-pedidos" className="hover:underline">Meus Pedidos</Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src={balaoLogo} alt="Balão da Informática" className="h-12 md:h-16" />
            </Link>

            {/* Search Bar */}
            {onSearchChange && (
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pesquise seu produto..."
                    value={searchValue || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2"
                    style={{ borderColor: '#DC2626' }}
                  />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-white p-2 rounded-lg transition-colors" style={{ backgroundColor: '#DC2626' }}>
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Cart */}
            {!hideCart && (
              <button 
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-colors relative"
                style={{ backgroundColor: '#DC2626' }}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="hidden md:inline font-medium">Carrinho</span>
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold" style={{ color: '#DC2626' }}>
                    {totalItems}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        {!hideNavigation && (
          <nav className="bg-gray-100 border-t border-gray-200">
            <div className="container">
              <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
                <Link to="/" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors whitespace-nowrap font-medium">
                  Início
                </Link>
                <Link to="/loja" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors whitespace-nowrap font-medium">
                  <Menu className="h-4 w-4" />
                  Loja
                </Link>
                <Link to="/monte-voce-mesmo" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors whitespace-nowrap font-medium" style={{ color: '#DC2626' }}>
                  <Cpu className="h-4 w-4" />
                  Monte seu PC
                </Link>
                <Link to="/automacao" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors whitespace-nowrap font-medium">
                  <Bot className="h-4 w-4" />
                  Automação
                </Link>
                <Link to="/loja?category=notebook" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors whitespace-nowrap font-medium">
                  <Laptop className="h-4 w-4" />
                  Notebooks
                </Link>
                <Link to="/loja?category=hardware" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors whitespace-nowrap font-medium">
                  <HardDrive className="h-4 w-4" />
                  Hardware
                </Link>
                <Link to="/loja?category=monitor" className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-white rounded-lg transition-colors whitespace-nowrap font-medium">
                  <Monitor className="h-4 w-4" />
                  Monitores
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}