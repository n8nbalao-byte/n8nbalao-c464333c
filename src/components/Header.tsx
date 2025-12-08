import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-white.svg";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Início", scrollTo: null },
  { href: "/#pricing", label: "Preços", scrollTo: "pricing" },
  { href: "/#benefits", label: "Benefícios", scrollTo: "benefits" },
  { href: "/#testimonials", label: "Depoimentos", scrollTo: "testimonials" },
  { href: "/loja", label: "Loja", scrollTo: null },
  { href: "/monte-voce-mesmo", label: "Monte Você Mesmo", scrollTo: null },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, setIsOpen } = useCart();

  const handleNavClick = (e: React.MouseEvent, link: typeof navLinks[0]) => {
    if (link.scrollTo) {
      e.preventDefault();
      
      // If not on home page, navigate first then scroll
      if (location.pathname !== "/") {
        navigate("/");
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
          <img src={logo} alt="n8nBalão" className="h-8" />
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
    </header>
  );
}
