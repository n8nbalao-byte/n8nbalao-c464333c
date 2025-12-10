import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShoppingCart, User, Building2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Início", scrollTo: null },
  { href: "/loja?category=fluxos_n8n", label: "Fluxos n8n", scrollTo: null },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, setIsOpen } = useCart();
  const { company } = useCompany();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const customer = localStorage.getItem("customer");
    setIsLoggedIn(!!customer);
  }, [location.pathname]);

  const handleNavClick = (e: React.MouseEvent, link: typeof navLinks[0]) => {
    if (link.scrollTo) {
      e.preventDefault();
      const targetPath = (link as any).targetPath || "/";
      
      // If not on target page, navigate first then scroll
      if (location.pathname !== targetPath) {
        navigate(targetPath);
        setTimeout(() => {
          const element = document.getElementById(link.scrollTo!);
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const element = document.getElementById(link.scrollTo);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          {company?.logo ? (
            <img src={company.logo} alt={company.name || 'Logo'} className="h-8 object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="font-bold text-foreground">{company?.name || 'Sua Empresa'}</span>
            </div>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={(e) => handleNavClick(e, link)}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(isLoggedIn ? "/meus-pedidos" : "/cliente")}
            title={isLoggedIn ? "Meus Pedidos" : "Entrar"}
          >
            <User className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setIsOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
