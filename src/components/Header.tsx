import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo-white.svg";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/#pricing", label: "Preços" },
  { href: "/#benefits", label: "Benefícios" },
  { href: "/#testimonials", label: "Depoimentos" },
  { href: "/loja", label: "Loja" },
  { href: "/monte-voce-mesmo", label: "Monte Você Mesmo" },
];

export function Header() {
  const location = useLocation();

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
      </div>
    </header>
  );
}
